package okuri.core.service.block

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.isStrict
import okuri.core.enums.util.OperationType
import okuri.core.models.block.*
import okuri.core.models.block.request.*
import okuri.core.models.block.structure.BlockContentMetadata
import okuri.core.models.block.structure.Metadata
import okuri.core.models.block.structure.ReferenceMetadata
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
            parentId = request.parentId, // optional; slot/order managed by BlockChildrenService
            archived = false
        )
        val saved = blockRepository.save(entity)

        // 3) Create link rows ONLY for reference blocks
        if (payloadMeta is ReferenceMetadata) {
            dispatchReferenceUpsert(saved, payloadMeta)
        }

        // 4) (Optional) attach as child when parentId + slot are supplied by API that manages children
        // You can delegate to BlockChildrenService here if your CreateBlockRequest carries slot/order.
        // e.g. request.slot?.let { blockChildrenService.attachChild(request.parentId!!, saved.id!!, it, request.orderIndex) }

        // 5) Activity
        activityService.logActivity(
            activity = okuri.core.enums.activity.Activity.BLOCK,
            operation = OperationType.CREATE,
            userId = authTokenService.getUserId(),
            organisationId = saved.organisationId,
            targetId = saved.id,
            additionalDetails = "Created Block '${saved.id}' of type '${type.key}'"
        )

        return saved.toModel()
    }

    // ---------- UPDATE ----------
    @PreAuthorize("@organisationSecurity.hasOrg(#block.organisationId)")
    @Transactional
    fun updateBlock(block: Block): Block {
        val existing = blockRepository.findById(block.id).orElseThrow()
        require(existing.organisationId == block.organisationId) {
            "Block does not belong to the specified organisation"
        }

        // Enforce same kind (MVP)
        require(existing.payload::class == block.payload::class) {
            "Cannot switch payload kind (content <-> reference) on update. Create a new block instead."
        }

        val (newPayload, errors) = when (val incoming = block.payload) {
            is BlockContentMetadata -> {
                val old = (existing.payload as BlockContentMetadata)
                val merged = deepMergeJson(old.data, incoming.data)
                val errs = schemaService.validate(existing.type.schema, merged, existing.type.strictness)
                if (existing.type.strictness.isStrict() && errs.isNotEmpty()) {
                    throw SchemaValidationException(errs)
                }
                BlockContentMetadata(
                    data = merged,
                    meta = old.meta.copy(
                        validationErrors = errs,
                        lastValidatedVersion = existing.type.version
                    )
                ) to errs
            }

            is ReferenceMetadata -> {
                // We accept the incoming list as the new desired state
                val norm = incoming.copy(
                    meta = incoming.meta.copy(lastValidatedVersion = existing.type.version)
                )
                norm to emptyList()
            }
        }

        val updated = existing.apply {
            name = block.name ?: existing.name
            payload = newPayload
        }
        val saved = blockRepository.save(updated)

        // Upsert links if reference block
        if (newPayload is ReferenceMetadata) {
            dispatchReferenceUpsert(saved, newPayload)
        }

        activityService.logActivity(
            activity = okuri.core.enums.activity.Activity.BLOCK,
            operation = OperationType.UPDATE,
            userId = authTokenService.getUserId(),
            organisationId = saved.organisationId,
            targetId = saved.id,
            additionalDetails = "Updated Block '${saved.id}' of type '${saved.type.key}'"
        )

        return saved.toModel().copy(
            validationErrors = errors.ifEmpty { null }
        )
    }

    // ---------- READ (tree) ----------
    fun getBlock(blockId: UUID): BlockTree {
        val root = blockRepository.findById(blockId).orElseThrow()
        val node = buildNode(root, visited = mutableSetOf())
        return BlockTree(root = node)
    }

    private fun buildNode(entity: BlockEntity, visited: MutableSet<UUID>): Node {
        val id = requireNotNull(entity.id)
        val model = entity.toModel()

        if (!visited.add(id)) {
            // Cycles only possible for content nodes (ownership graph)
            return ContentNode(block = model, warnings = listOf("Cycle detected at ${model.id}"))
        }

        return when (val meta = entity.payload) {
            is ReferenceMetadata -> {
                // Resolve/link list for reference blocks
                val refs: List<Reference<*>> = blockReferenceService.findBlockReferences(id, meta)
                ReferenceNode(block = model, warnings = emptyList(), reference = refs)
            }

            is BlockContentMetadata -> {
                // Pull owned children via BlockChildrenService
                val edgesBySlot = blockChildrenService.findChildren(id) // Map<String, List<ChildLink>>
                val childNodes: Map<String, List<Node>> = edgesBySlot.mapValues { (_, links) ->
                    // batch fetch children
                    val ids = links.map { it.childId }.toSet()
                    val childrenById = blockRepository.findAllById(ids).associateBy { it.id!! }
                    links.sortedBy { it.orderIndex }.mapNotNull { link ->
                        val child = childrenById[link.childId] ?: return@mapNotNull null
                        buildNode(child, visited)
                    }
                }
                visited.remove(id)
                ContentNode(block = model, children = childNodes)
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
        // Heuristic: single BLOCK item ⇒ single linked block; otherwise ⇒ list of entities
        val items = meta.items
        val isSingleBlock = items.size == 1 && items.first().type == EntityType.BLOCK
        if (isSingleBlock) {
            val item: ReferenceItem = items.first()
            blockReferenceService.upsertReferenceFor(saved, item)
        } else {
            require(items.none { it.type == EntityType.BLOCK }) {
                "Reference list cannot contain BLOCK items. Use a single BLOCK Reference block."
            }
            blockReferenceService.upsertLinksFor(saved, items) // uses default "$.items" prefix
        }
    }

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