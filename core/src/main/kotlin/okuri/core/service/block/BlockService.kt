package okuri.core.service.block

import okuri.core.entity.block.BlockChildEntity
import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.BlockReferenceFetchPolicy
import okuri.core.enums.block.isStrict
import okuri.core.enums.util.OperationType
import okuri.core.models.block.Block
import okuri.core.models.block.Reference
import okuri.core.models.block.metadata.*
import okuri.core.models.block.request.CreateBlockRequest
import okuri.core.models.block.tree.*
import okuri.core.models.common.json.JsonObject
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
    private val blockChildrenService: BlockChildrenService,
    private val blockReferenceService: BlockReferenceService,
    private val schemaService: SchemaService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {
    // ---------- CREATE ----------
    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    @Transactional
    fun createBlock(request: CreateBlockRequest): Block {
        // If we are creating a child. Ensure parent exists, and appropriate metadata has been supplied
        request.parentId?.run {
            requireNotNull(request.slot) { "Slot must be provided when creating a child block" }
            requireNotNull(request.orderIndex) { "Order index must be provided when creating a child block" }
            requireNotNull(request.parentNesting) { "Parent nesting must be provided when creating a child block" }
        }

        val type: BlockTypeEntity = resolveType(request)
        require(!type.archived) { "BlockType '${type.key}' is archived" }

        // 1) Validate ONLY content blocks
        val validatedMetadata: Metadata = request.payload.let {
            when (it) {
                is BlockContentMetadata -> {
                    val errs = schemaService.validate(type.schema, it, type.strictness)
                    if (type.strictness.isStrict() && errs.isNotEmpty()) {
                        throw SchemaValidationException(errs)
                    }

                    it.meta.apply {
                        this.lastValidatedVersion = type.version
                        this.validationErrors = errs
                    }

                    it

                }

                is ReferenceMetadata -> {
                    it.meta.apply {
                        this.lastValidatedVersion = type.version
                    }
                    it
                }
            }
        }

        // 2) Persist
        val entity = BlockEntity(
            id = null,
            organisationId = request.organisationId,
            type = type,
            name = request.name,
            payload = validatedMetadata,
            archived = false
        )

        blockRepository.save(entity).run {
            requireNotNull(this.id) { "Block '$id' not found" }

            // If a parent ID is supplied. This would indicate we are creating a child block
            request.parentId?.let {
                blockRepository.findById(it).orElseThrow()
                blockChildrenService.addChild(
                    parentId = it,
                    child = this,
                    // Parent Metadata was previously validated for not null at the start of this method
                    slot = request.slot!!,
                    index = request.orderIndex!!,
                    nesting = request.parentNesting!!
                )
            }


            // Extract and store references for Reference Blocks
            when (validatedMetadata) {
                is ReferenceMetadata -> dispatchReferenceUpsert(this, validatedMetadata)
                else -> Unit
            }

            // 5) Activity
            activityService.logActivity(
                activity = okuri.core.enums.activity.Activity.BLOCK,
                operation = OperationType.CREATE,
                userId = authTokenService.getUserId(),
                organisationId = this.organisationId,
                targetId = this.id,
                additionalDetails = "Created Block '${this.id}' of type '${type.key}'"
            )

            return this.toModel()
        }
    }

    // ---------- UPDATE ----------
    @PreAuthorize("@organisationSecurity.hasOrg(#block.organisationId)")
    @Transactional
    fun updateBlock(block: Block): Block {
        val existing = blockRepository.findById(block.id).orElseThrow()
        require(existing.organisationId == block.organisationId) {
            "Block does not belong to the specified organisation"
        }

        require(existing.payload::class == block.payload::class) {
            "Cannot switch payload kind (content <-> reference) on update. Create a new block instead."
        }

        require(existing.type.id == block.type.id) {
            "Cannot change block type on update. Create a new block instead."
        }

        val updatedMetadata: Metadata = block.payload.let {
            when (it) {
                is BlockContentMetadata -> {
                    existing.payload.run {
                        require(this is BlockContentMetadata) {
                            "Existing block payload is not BlockContentMetadata"
                        }
                        val updated: JsonObject = deepMergeJson(this.data, it.data)
                        it.apply {
                            this.data = updated
                        }

                        val errs = schemaService.validate(existing.type.schema, it, existing.type.strictness)

                        if (existing.type.strictness.isStrict() && errs.isNotEmpty()) {
                            throw SchemaValidationException(errs)
                        }

                        it.meta.apply {
                            this.lastValidatedVersion = block.type.version
                            this.validationErrors = errs
                        }

                        it
                    }


                }

                is ReferenceMetadata -> {
                    it.meta.apply {
                        this.lastValidatedVersion = block.type.version
                    }
                    it
                }
            }
        }

        val updated = existing.apply {
            name = block.name ?: existing.name
            payload = updatedMetadata
        }

        val saved = blockRepository.save(updated)

        // Upsert links if reference block
        if (updatedMetadata is ReferenceMetadata) {
            dispatchReferenceUpsert(saved, updatedMetadata)
        }

        activityService.logActivity(
            activity = okuri.core.enums.activity.Activity.BLOCK,
            operation = OperationType.UPDATE,
            userId = authTokenService.getUserId(),
            organisationId = saved.organisationId,
            targetId = saved.id,
            additionalDetails = "Updated Block '${saved.id}' of type '${saved.type.key}'"
        )

        return saved.toModel()
    }

    // ---------- READ (tree) ----------
    fun getBlock(blockId: UUID): BlockTree {
        val root = blockRepository.findById(blockId).orElseThrow()
        val node = buildNode(root.toModel(), visited = mutableSetOf())
        return BlockTree(root = node)
    }

    private fun buildNode(block: Block, visited: MutableSet<UUID>): Node {
        if (!visited.add(block.id)) {
            // Cycles only possible for content nodes (ownership graph)
            return ContentNode(block = block, warnings = listOf("Cycle detected at ${block.id}"))
        }

        return when (val meta = block.payload) {
            is BlockReferenceMetadata -> {
                val (ref, edge) = blockReferenceService.findBlockLink(block.id, meta)
                val blockRef: Reference = meta.fetchPolicy.let {
                    if (it == BlockReferenceFetchPolicy.LAZY || edge == null) return@let ref

                    // Build block tree for EAGER fetch
                    val tree = getBlock(ref.entityId)
                    ref.copy(
                        entity = tree,
                        warning = null,
                    )
                }

                visited.remove(block.id)
                ReferenceNode(
                    block = block,
                    reference = BlockTreeReference(
                        reference = blockRef
                    )
                )
            }

            is EntityReferenceMetadata -> {
                val entities = blockReferenceService.findListReferences(block.id, meta)
                visited.remove(block.id)
                ReferenceNode(
                    block = block,
                    reference = EntityReference(
                        reference = entities
                    )
                )
            }

            is BlockContentMetadata -> {
                // Pull owned children via BlockChildrenService
                val edgesBySlot: Map<String, List<BlockChildEntity>> =
                    blockChildrenService.listChildrenGrouped(block.id)
                val childNodes: Map<String, List<Node>> = edgesBySlot.mapValues { (_, links) ->
                    // batch fetch children
                    val ids = links.map { it.childId }.toSet()
                    val childrenById = blockRepository.findAllById(ids).associateBy { it.id!! }
                    links.sortedBy { it.orderIndex }.mapNotNull { link ->
                        val child = childrenById[link.childId] ?: return@mapNotNull null
                        buildNode(child.toModel(), visited)
                    }
                }
                visited.remove(block.id)
                ContentNode(block = block, children = childNodes)
            }
        }
    }

    // ---------- helpers ----------
    private fun resolveType(request: CreateBlockRequest): BlockTypeEntity =
        when {
            request.typeId != null -> blockTypeService.getById(request.typeId)
            request.typeKey != null -> blockTypeService.getByKey(
                request.typeKey,
                request.organisationId,
                request.typeVersion
            )

            else -> throw IllegalArgumentException("Either typeId or typeKey must be provided")
        }

    private fun dispatchReferenceUpsert(saved: BlockEntity, meta: ReferenceMetadata) {
        meta.let {
            when (it) {
                is BlockReferenceMetadata -> {
                    blockReferenceService.upsertBlockLinkFor(saved, it)
                }

                is EntityReferenceMetadata -> {
                    blockReferenceService.upsertLinksFor(saved, it)
                }
            }
        }
    }

    // ---------- ARCHIVE ----------
    @PreAuthorize("@organisationSecurity.hasOrg(#block.organisationId)")
    @Transactional
    fun archiveBlock(block: Block, status: Boolean) {
        val existing = blockRepository.findById(block.id).orElseThrow()
        require(existing.organisationId == block.organisationId) {
            "Block does not belong to the specified organisation"
        }

        if (existing.archived == status) return // No-op if already in desired state

        val updated = existing.apply {
            archived = status
        }

        blockRepository.save(updated)

        activityService.logActivity(
            activity = okuri.core.enums.activity.Activity.BLOCK,
            operation = if (status) OperationType.ARCHIVE else OperationType.RESTORE,
            userId = authTokenService.getUserId(),
            organisationId = updated.organisationId,
            targetId = updated.id,
            additionalDetails = "Block '${updated.id}' archive status set to $status"
        )
    }

    /**
     * Deletes the specified block from the system, will also recursively delete all embedded child blocks.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#tree.root.block.organisationId)")
    @Transactional
    fun deleteBlock(tree: BlockTree) {
        TODO()
    }

    // ---------- helpers ----------
    @Suppress("UNCHECKED_CAST")
    private fun deepMergeJson(a: Map<String, Any?>, b: Map<String, Any?>): Map<String, Any?> {
        val out = a.toMutableMap()
        for ((k, vb) in b) {
            val va = out[k]
            out[k] = if (va is Map<*, *> && vb is Map<*, *>) {
                deepMergeJson(va as Map<String, Any?>, vb as Map<String, Any?>)
            } else vb
        }
        return out
    }

}