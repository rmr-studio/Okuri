package okuri.core.service.block

import okuri.core.enums.core.EntityType
import okuri.core.models.block.request.AttachBlockRequest
import okuri.core.models.block.BlockTree
import okuri.core.models.block.request.DetachBlockRequest
import okuri.core.repository.block.EntityBlockReferenceRepository
import org.springframework.stereotype.Service
import java.util.*

/**
 *  This service layer is responsible for handling the management of block references from within an entity.
 */
@Service
class EntityBlockReferenceService(
    private val entityBlockReferenceRepository: EntityBlockReferenceRepository,
    private val blockService: BlockService
) {

    /**
     * Attaches a block reference to an entity according to the provided request.
     *
     * @param request Details of the block to attach and where it should be attached (target entity, position, and any attachment metadata).
     */
    fun attachBlock(request: AttachBlockRequest) {
        TODO()
    }

    /**
     * Removes a block reference from an entity according to the provided request.
     *
     * @param request Details identifying the entity and the block reference to detach.
     */
    fun detachBlock(request: DetachBlockRequest) {
        TODO()
    }

    /**
     * Retrieve the block tree rooted at the specified entity.
     *
     * @param includePayload Whether to include each block's payload data (`true` to include, `false` to omit).
     * @param expandRefs Whether to expand block references into the referenced blocks' subtrees (`true` to expand, `false` to keep references as-is).
     * @param maxDepth Maximum traversal depth from the root (1 = root and its immediate children).
     * @return The BlockTree representing the requested subtree for the given entity root.
     */
    fun getBlocksForRoot(
        entityId: UUID,
        entityType: EntityType,
        includePayload: Boolean = true,
        expandRefs: Boolean = false,
        maxDepth: Int = 1
    ): BlockTree {
        TODO()
    }
}