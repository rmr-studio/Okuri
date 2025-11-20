package okuri.core.service.block

import okuri.core.entity.block.BlockTreeLayoutEntity
import okuri.core.enums.core.EntityType
import okuri.core.models.block.layout.TreeLayout
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
        id: UUID,
    ): BlockTreeLayoutEntity {
        return findOrThrow { layoutRepository.findById(id) }
    }

    /**
     * Resolves the appropriate layout for a page given a user context.
     *
     * Priority:
     * 1. User-specific layout
     * 2. Organization default layout
     *
     * @param entityId The page to find a layout for
     * @return The resolved layout, or null if no layout exists
     */
    fun fetchPageLayouts(
        entityId: UUID,
        entityType: EntityType,
    ): TreeLayout? {
        TODO()
    }

    /**
     * Saves or updates an organization default layout.
     *
     * @param blockId The block to save layout for
     * @param organisationId The organization context
     * @param layout The Gridstack layout to save
     * @return The saved layout entity
     */
    @Transactional
    fun saveLayout(
        blockId: UUID,
        organisationId: UUID,
        layout: TreeLayout
    ): BlockTreeLayoutEntity {
        TODO()
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
     * Saves or updates a user-specific personalized layout.
     *
     * @param entityId The page to save layout for
     * @param entityType The type of entity
     * @param layout The Gridstack layout to save
     * @return The saved layout entity
     */
    @Transactional
    fun saveUserLayout(
        entityId: UUID,
        entityType: EntityType,
        layout: TreeLayout
    ): BlockTreeLayoutEntity {
        TODO()
    }

    @Transactional
    fun resetUserLayout(entityId: UUID, entityType: EntityType) {
        TODO()
    }

    /**
     * Gets all layout versions for a block (all scopes).
     * Useful for admin/debugging purposes.
     */
    fun getAllLayoutsForPage(blockId: UUID): List<BlockTreeLayoutEntity> {
        TODO()
    }

    /**
     * Deletes all layouts for a block.
     * Should be called when a block is deleted.
     */
    @Transactional
    fun deleteAllLayoutsForPage(id: UUID, type: EntityType) {
        TODO()
    }

    /**
     * Extension function to extract all block IDs from a block tree recursively.
     * This is useful for batch loading layouts.
     */
    fun extractBlockIdsFromTree(blockIds: Set<UUID>): Set<UUID> {
        // This would need to be implemented based on your block tree structure
        // For now, returning the input as-is
        // In practice, you'd traverse the tree and collect all descendant block IDs
        return blockIds
    }
}


