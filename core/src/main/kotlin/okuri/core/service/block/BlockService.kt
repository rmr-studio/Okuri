package okuri.core.service.block

import jakarta.transaction.Transactional
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
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.schema.SchemaService
import okuri.core.service.schema.SchemaValidationException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service layer for managing blocks within the application.
 */
@Service
class BlockService(
    private val blockRepository: BlockRepository,
    private val blockTypeService: BlockTypeService,
    private val blockReferenceService: BlockReferenceService,
    private val blockReferenceRepository: BlockReferenceRepository,
    private val schemaService: SchemaService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {
    /**
     * This function creates a new block based on the provided request data.
     * It ensures that the block type specified in the request exists before creating the block.
     * Depending on the block type's validation scope. It will also examine the payload and cross validate with the
     * provided schema. And throw an error if the payload does not conform to the schema.
     *
     * @param request The request object containing details for the new block.
     * @return The created block.
     */
    @PreAuthorize("#organisationSecurity.hasOrg(#request.organisationId)")
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
                activity = okuri.core.enums.activity.Activity.BLOCK_TYPE,
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
     * This function updates an existing block with new information.
     * It ensures that the block type specified in the block exists before updating the block.
     * It will also examine the payload and cross validate with the provided schema based on the provided validation settings.
     *
     * @param block The block model containing updated information.
     * @return The updated block.
     */
    @PreAuthorize("#organisationSecurity.hasOrg(#block.organisationId)")
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
                    activity = okuri.core.enums.activity.Activity.BLOCK_TYPE,
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
     * This function retrieves a block by its ID, with options to expand references and set maximum depth for child blocks.
     * If expandRefs is true, any referenced blocks will be fully expanded up to the specified maxDepth.
     * If expandRefs is false, only the immediate children of the block will be included, without expanding references.
     * The maxDepth parameter controls how deep the child blocks are fetched in the hierarchy.
     * If maxDepth is 1, only the immediate children are included. If maxDepth is greater than 1, the function will recursively fetch child blocks up to the specified depth.
     *
     * @param blockId The UUID of the block to be retrieved.
     * @param expandRefs Whether to expand referenced blocks or not. Default is false.
     * @param maxDepth The maximum depth of child blocks to retrieve. Default is 1.
     *
     * @return The block tree starting from the specified block, including its children and expanded references as per the parameters.
     */
    fun getBlock(blockId: UUID, expandRefs: Boolean = false, maxDepth: Int = 1): BlockTree {
        val rootEntity = blockRepository.findById(blockId).orElseThrow()
        val visited = mutableSetOf<UUID>()
        val node = buildNode(rootEntity, depth = if (expandRefs) maxDepth else 1, visited = visited)
        return BlockTree(maxDepth = if (expandRefs) maxDepth else 1, expandRefs = expandRefs, root = node)
    }

    private fun buildNode(entity: BlockEntity, depth: Int, visited: MutableSet<UUID>): BlockNode {
        val id = requireNotNull(entity.id) { "Block ID cannot be null" }
        entity.toModel().let { block ->
            if (depth <= 1) return BlockNode(block = block)
            if (!visited.add(id)) {
                return BlockNode(block = block, warnings = listOf("Cycle detected at ${block.id}"))
            }

            val edges = blockReferenceService.findOwnedBlocks(id)
            val children: Map<String, List<BlockNode>> =
                edges.mapValues { (_, refs) ->
                    refs.mapNotNull { ref ->
                        val child = blockRepository.findById(ref.entityId).orElse(null) ?: return@mapNotNull null
                        buildNode(child, depth - 1, visited)
                    }
                }

            val links = blockReferenceService.findLinkedBlocks(id)

            visited.remove(id)
            return BlockNode(block = block, children = children)
        }
    }

    /**
     * This function will update the archival status of a block.
     *
     * @param block The block to be archived or unarchived.
     * @param archive True to archive the block, false to un-archive it.
     *
     * @return The updated block tree starting from the affected block.
     *
     */
    @PreAuthorize("#organisationSecurity.hasOrg(#block.organisationId)")
    fun archiveBlock(block: Block, archive: Boolean): Boolean {
        authTokenService.getUserId().let { user ->
            blockRepository.findById(block.id).orElseThrow().let { block ->
                if (block.archived == archive) return false
                block.apply {
                    this.archived = archive
                }.run {
                    blockRepository.save(this)
                    activityService.logActivity(
                        activity = okuri.core.enums.activity.Activity.BLOCK_TYPE,
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
     * Deletes a block by its ID.
     * This will then also delete all child blocks who are not referenced by any other blocks in the system.
     *
     * @param block The block that is to be delete
     * @return The number of blocks deleted.
     */
    fun deleteBlock(block: Block): Int {
        TODO()
    }

    /** Simple deep merge for Map<String, Any?> */
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