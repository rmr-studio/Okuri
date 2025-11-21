package okuri.core.service.block

import okuri.core.entity.block.BlockTreeLayoutEntity
import okuri.core.enums.core.EntityType
import okuri.core.models.block.layout.TreeLayout
import okuri.core.models.block.tree.BlockTreeLayout
import okuri.core.repository.block.BlockTreeLayoutRepository
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Service for managing block tree layouts with support for multiple scopes.
 *
 * Each entity will have a layout consisting of many blocks.
 *
 * Handles layout resolution priority:
 * 1. User-specific layout (highest priority)
 * 2. Team layout
 * 3. Organization default layout (fallback)
 */
@Service
class BlockTreeLayoutService(
    private val layoutRepository: BlockTreeLayoutRepository,
) {

    fun fetchLayoutById(
        layoutId: UUID
    ): BlockTreeLayoutEntity {
        return findOrThrow { layoutRepository.findById(layoutId) }
    }

    fun fetchLayoutForEntity(
        id: UUID,
        type: EntityType
    ): BlockTreeLayoutEntity {
        return findOrThrow { layoutRepository.findByEntityIdAndEntityType(id, type) }
    }


    @Transactional
    fun updateLayoutSnapshot(
        prev: BlockTreeLayoutEntity,
        layout: TreeLayout,
        version: Int
    ): BlockTreeLayoutEntity {
        prev.apply {
            this.layout = layout
            this.version = version
        }.run {
            return layoutRepository.save(this)
        }
    }

    /**
     * Extension function to extract all block IDs from a block tree recursively.
     * This is useful for batch loading layouts.
     */
    fun extractBlockIdsFromTree(layout: BlockTreeLayout): Set<UUID> {
        TODO()
    }
}


