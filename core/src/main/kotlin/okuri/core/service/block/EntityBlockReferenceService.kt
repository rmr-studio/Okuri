package okuri.core.service.block

import okuri.core.enums.core.EntityType
import okuri.core.models.block.request.AttachBlockRequest
import okuri.core.models.block.request.BlockTree
import okuri.core.models.block.request.DetachBlockRequest
import okuri.core.repository.block.EntityBlockReferenceRepository
import org.springframework.stereotype.Service
import java.util.*

/**
 *  This service layer is responsible for handling the management of block references from within an entity.
 */
@Service
class EntityBlockReferenceService(
    private val entityBlockReferenceRepository: EntityBlockReferenceRepository
) {
    fun attachBlock(request: AttachBlockRequest) {}
    fun detachBlock(request: DetachBlockRequest) {}
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