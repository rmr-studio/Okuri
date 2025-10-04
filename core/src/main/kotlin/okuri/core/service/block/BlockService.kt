package okuri.core.service.block

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.isStrict
import okuri.core.enums.util.OperationType
import okuri.core.models.block.Block
import okuri.core.models.block.request.BlockNode
import okuri.core.models.block.request.BlockTree
import okuri.core.models.block.request.CreateBlockRequest
import okuri.core.models.block.structure.BlockMeta
import okuri.core.models.block.structure.BlockMetadata
import okuri.core.repository.block.BlockRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.schema.SchemaService
import okuri.core.service.schema.SchemaValidationException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Service layer for managing blocks within the application.
 */
@Service
class BlockService(
    private val blockRepository: BlockRepository,
    private val blockTypeService: BlockTypeService,
    private val blockReferenceService: BlockReferenceService,
    private val schemaService: SchemaService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {
    /**
     * Create a new block for the given organisation using the specified block type and payload.
     *
     * Validates the payload against the block type's schema (respecting strictness), persists the block,
     * rebuilds references from the payload, and records creation activity.
     *
     * @param request Request containing organisationId, a block type identifier (either `typeId` or `typeKey` with `typeVersion`), the block name, and a `payload` map.
     * @return The created Block model with `validationErrors` populated or `null` if there are no validation errors.
     * @throws IllegalArgumentException If neither `typeId` nor `typeKey` is provided in the request.
     * @throws IllegalStateException If the resolved block type is archived.
     * @throws SchemaValidationException If the block type is strict and the payload fails schema validation.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    @Transactional
    fun createBlock(request: CreateBlockRequest): Block {
        // Get Block from specific ID, or Key and version combination
        val type: BlockTypeEntity = request.let {
            if (it.typeId != null) {
                return@let blockTypeService.getById(it.typeId)
            }

            if (it.typeKey != null) {
                return@let blockTypeService.getByKey(
                    it.typeKey,
                    request.organisationId,
                    request.typeVersion
                )
            }

            throw IllegalArgumentException("Either typeId or typeKey must be provided")
        }

        if (type.archived) throw IllegalStateException("BlockType '${type.key}' is archived")

        val data: Map<String, Any?> =
            (request.payload["data"] as? Map<*, *>)?.mapKeys { it.key as String } ?: emptyMap()

        // Validate payload data against schema
        val validationErrors: List<String> = schemaService.validate(type.schema, data, type.strictness).let { errors ->
            if (type.strictness.isStrict() && errors.isNotEmpty()) {
                throw SchemaValidationException(errors)
            }
            errors
        }

        val entity = BlockEntity(
            organisationId = request.organisationId,
            type = type,
            name = request.name,
            payload = BlockMetadata(
                data = data,
                refs = emptyList(), // we rebuild from data below
                meta = BlockMeta(
                    validationErrors = validationErrors,
                    lastValidatedVersion = type.version
                )
            ),
            parent = null,
            archived = false
        )

        blockRepository.save(entity).run {
            // Save refs (and OWNED parenting) based on metadata.data
            blockReferenceService.upsertReferencesFor(this, entity.payload.data)
            activityService.logActivity(
                activity = okuri.core.enums.activity.Activity.BLOCK,
                operation = OperationType.CREATE,
                userId = authTokenService.getUserId(),
                organisationId = organisationId,
                targetId = id,
                additionalDetails = "Created Block '${id}' of type '${type.key}'"
            )
            return this.toModel().copy(
                validationErrors = validationErrors.ifEmpty { null }
            )
        }


    }

    /**
     * Apply partial updates to an existing block, validate the merged payload against the block type schema, persist the changes, rebuild references, and record an update activity.
     *
     * @param block The block model containing updated fields; payload.data is merged with the existing block's data for a partial update.
     * @return The persisted updated block model; `validationErrors` is `null` when there are no validation errors.
     * @throws IllegalArgumentException if the block does not belong to the specified organisation or the block cannot be found.
     * @throws SchemaValidationException when the block type's strictness requires validation and the merged payload fails schema validation.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#block.organisationId)")
    @Transactional
    fun updateBlock(block: Block): Block {
        blockRepository.findById(block.id).orElseThrow().run {
            if (this.organisationId != block.organisationId) {
                throw IllegalArgumentException("Block does not belong to the specified organisation")
            }
            return@run this
        }.let { existing ->
            // Merge data (partial update)
            val mergedData = deepMergeJson(existing.payload.data, block.payload.data)
            val errors = schemaService.validate(existing.type.schema, mergedData, existing.type.strictness)
            if (existing.type.strictness.isStrict() && errors.isNotEmpty()) throw SchemaValidationException(errors)

            val updatedBlock = existing.apply {
                name = block.name ?: existing.name
                payload = existing.payload.copy(
                    data = mergedData,
                    meta = existing.payload.meta.copy(
                        validationErrors = errors,
                        lastValidatedVersion = existing.type.version
                    )
                )
            }

            blockRepository.save(updatedBlock).run {
                // Rebuild refs (and OWNED parenting) based on merged data
                activityService.logActivity(
                    activity = okuri.core.enums.activity.Activity.BLOCK,
                    operation = OperationType.UPDATE,
                    userId = authTokenService.getUserId(),
                    organisationId = organisationId,
                    targetId = id,
                    additionalDetails = "Updated Block '${id}' of type '${type.key}'"
                )
                blockReferenceService.upsertReferencesFor(this, mergedData)
                return this.toModel().copy(
                    validationErrors = errors.ifEmpty { null }
                )
            }
        }
    }

    /**
     * Builds a BlockTree for the block with the given id, optionally expanding referenced blocks up to a depth.
     *
     * @param blockId UUID of the root block.
     * @param expandRefs Whether referenced blocks should be expanded; when true, references are expanded up to maxDepth.
     * @param maxDepth Maximum depth to traverse for child and (if enabled) referenced blocks; 1 includes only the root's immediate children.
     * @return A BlockTree containing the root node and metadata (`maxDepth` and `expandRefs`).
     */
    fun getBlock(blockId: UUID, expandRefs: Boolean = false, maxDepth: Int = 1): BlockTree {
        val rootEntity = blockRepository.findById(blockId).orElseThrow()
        val visited = mutableSetOf<UUID>()
        val node =
            buildNode(rootEntity, depth = if (expandRefs) maxDepth else 1, visited = visited, expand = expandRefs)
        return BlockTree(maxDepth = if (expandRefs) maxDepth else 1, expandRefs = expandRefs, root = node)
    }

    /**
     * Constructs a BlockNode for the given BlockEntity, recursively including child nodes up to the specified depth and optionally expanding referenced blocks.
     *
     * The function detects cycles and records a warning when a previously visited block is encountered.
     *
     * @param entity The root BlockEntity to convert into a BlockNode.
     * @param depth Maximum recursion depth for including child nodes; when less than or equal to 1 only references are included.
     * @param visited Mutable set of visited block IDs used for cycle detection; callers should provide and maintain this set across recursion.
     * @param expand If true, include expanded data for linked references; otherwise include only reference metadata.
     * @return A BlockNode representing the entity with its children (up to `depth`) and linked references; may contain warnings if a cycle was detected. */
    private fun buildNode(
        entity: BlockEntity,
        depth: Int,
        visited: MutableSet<UUID>,
        expand: Boolean = false
    ): BlockNode {
        val id = requireNotNull(entity.id) { "Block ID cannot be null" }
        entity.toModel().let { block ->
            if (depth <= 1) {
                val links = blockReferenceService.findLinkedBlocks(id)
                return BlockNode(block = block, references = links)
            }

            if (!visited.add(id)) {
                return BlockNode(block = block, warnings = listOf("Cycle detected at ${block.id}"))
            }

            val edges = blockReferenceService.findOwnedBlocks(id)
            // Build children nodes
            val children: Map<String, List<BlockNode>> =
                edges.mapValues { (_, refs) ->
                    val ids = refs.map { it.entityId }.toSet()
                    // Bulk fetch all children to avoid N+1
                    val childrenById = blockRepository.findAllById(ids).associateBy { it.id!! }
                    refs.mapNotNull { ref ->
                        val child = childrenById[ref.entityId] ?: return@mapNotNull null
                        buildNode(child, depth - 1, visited)
                    }
                }

            val links = blockReferenceService.findLinkedBlocks(id, expand = expand)

            visited.remove(id)
            return BlockNode(block = block, children = children, references = links)
        }
    }

    /**
     * Toggle the archived state of the given block.
     *
     * @param block The block whose archived flag will be changed; must belong to the caller's organisation.
     * @param archive `true` to set the block as archived, `false` to restore it.
     * @return `true` if the block's archived state was changed, `false` if it was already in the requested state.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#block.organisationId)")
    fun archiveBlock(block: Block, archive: Boolean): Boolean {
        authTokenService.getUserId().let { user ->
            blockRepository.findById(block.id).orElseThrow().let { block ->
                if (block.archived == archive) return false
                block.apply {
                    this.archived = archive
                }.run {
                    blockRepository.save(this)
                    activityService.logActivity(
                        activity = okuri.core.enums.activity.Activity.BLOCK,
                        operation = if (archive) OperationType.ARCHIVE else OperationType.RESTORE,
                        userId = user,
                        organisationId = block.organisationId,
                        targetId = block.id,
                        additionalDetails = archive.let {
                            if (it) {
                                return@let "Archived Block '${block.id}'"
                            }

                            return@let "Restored Block '${block.id}'"
                        }
                    )
                }
            }

        }

        return true
    }

    /**
     * Removes the given block and any descendant blocks that are not referenced by other blocks.
     *
     * @param block The root block to delete.
     * @return The total number of blocks removed.
    fun deleteBlock(block: Block): Int {
        TODO()
    }

    /**
     * Recursively merges two JSON-like maps, producing a new map that combines keys from both.
     *
     * Nested maps are merged recursively; when a key exists in both maps and both values are maps,
     * their entries are merged. For keys where the new value is not a map, the value from
     * `objectNew` replaces the one from `objectOld`.
     *
     * @param objectOld The original map whose entries are used as defaults.
     * @param objectNew The map with values that override or extend `objectOld`.
     * @return A new map containing the deep-merged result of `objectOld` and `objectNew`.
     */
    @Suppress("UNCHECKED_CAST")
    private fun deepMergeJson(objectOld: Map<String, Any?>, objectNew: Map<String, Any?>): Map<String, Any?> {
        val result = objectOld.toMutableMap()
        for ((k, vNew) in objectNew) {
            val vOld = result[k]
            result[k] = when {
                vOld is Map<*, *> && vNew is Map<*, *> ->
                    deepMergeJson(vOld as Map<String, Any?>, vNew as Map<String, Any?>)

                else -> vNew
            }
        }
        return result
    }
}