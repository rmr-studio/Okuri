package okuri.core.service.block

import okuri.core.entity.block.BlockTreeLayoutEntity
import okuri.core.enums.block.layout.LayoutScope
import okuri.core.enums.core.EntityType
import okuri.core.models.block.layout.TreeLayout
import okuri.core.repository.block.BlockTreeLayoutRepository
import okuri.core.service.auth.AuthTokenService
import org.springframework.security.access.prepost.PostAuthorize
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
    private val authTokenService: AuthTokenService
) {

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
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject?.organisationId)")
    fun fetchPageLayouts(
        entityId: UUID,
        entityType: EntityType,
    ): TreeLayout? {
        // Try user-specific layout first
        val userLayout = layoutRepository.findUserLayout(blockId, userId)
        if (userLayout != null) {
            return userLayout.layout
        }

        // Fall back to organization default
        val orgLayout = layoutRepository.findOrganizationLayout(blockId)
        return orgLayout?.layout
    }

    /**
     * Batch resolves layouts for multiple blocks.
     *
     * This is highly optimized for loading layouts alongside a block tree,
     * using a single query with priority ordering.
     *
     * @param blockIds Set of block IDs to find layouts for
     * @param organisationId The organization context
     * @param userId The user requesting the layouts
     * @return Map of blockId to resolved layout
     */
    fun resolveLayoutsForBlocks(
        blockIds: Set<UUID>,
        organisationId: UUID,
        userId: UUID
    ): Map<UUID, TreeLayout> {
        if (blockIds.isEmpty()) return emptyMap()

        val layouts = layoutRepository.findLayoutsForBlocks(blockIds, organisationId, userId)

        return layouts.associate { it.blockId to it.layout }
    }

    /**
     * Batch resolves organization default layouts only (no user context).
     *
     * Useful for public-facing views or when user is not authenticated.
     */
    fun resolveOrganizationLayoutsForBlocks(
        blockIds: Set<UUID>
    ): Map<UUID, TreeLayout> {
        if (blockIds.isEmpty()) return emptyMap()

        val layouts = layoutRepository.findOrganizationLayoutsForBlocks(blockIds)
        return layouts.associate { it.blockId to it.layout }
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
    fun saveOrganizationLayout(
        blockId: UUID,
        organisationId: UUID,
        layout: TreeLayout
    ): BlockTreeLayoutEntity {
        val existing = layoutRepository.findOrganizationLayout(blockId)

        return if (existing != null) {
            // Update existing
            existing.layout = layout
            existing.version += 1
            layoutRepository.save(existing)
        } else {
            // Create new
            val newLayout = BlockTreeLayoutEntity.createOrganizationLayout(
                blockId = blockId,
                organisationId = organisationId,
                layout = layout
            )
            layoutRepository.save(newLayout)
        }
    }

    /**
     * Saves or updates a user-specific personalized layout.
     *
     * @param blockId The block to save layout for
     * @param organisationId The organization context
     * @param userId The user who owns this layout
     * @param layout The Gridstack layout to save
     * @return The saved layout entity
     */
    @Transactional
    fun saveUserLayout(
        blockId: UUID,
        organisationId: UUID,
        userId: UUID,
        layout: TreeLayout
    ): BlockTreeLayoutEntity {
        val existing = layoutRepository.findUserLayout(blockId, userId)

        return if (existing != null) {
            // Update existing
            existing.layout = layout
            existing.version += 1
            layoutRepository.save(existing)
        } else {
            // Create new
            val newLayout = BlockTreeLayoutEntity.createUserLayout(
                blockId = blockId,
                organisationId = organisationId,
                userId = userId,
                layout = layout
            )
            layoutRepository.save(newLayout)
        }
    }

    /**
     * Resets a user's personalized layout, falling back to organization default.
     *
     * @param blockId The block to reset layout for
     * @param userId The user whose layout to reset
     */
    @Transactional
    fun resetUserLayout(entityId: UUID, entityType: EntityType, userId: UUID) {
        layoutRepository.deleteByBlockIdAndScopeAndOwnerId(
            blockId = blockId,
            scope = LayoutScope.USER,
            ownerId = userId
        )
    }

    /**
     * Gets all layout versions for a block (all scopes).
     * Useful for admin/debugging purposes.
     */
    fun getAllLayoutsForPage(blockId: UUID): List<BlockTreeLayoutEntity> {
        return layoutRepository.findByBlockId(blockId)
    }

    /**
     * Deletes all layouts for a block.
     * Should be called when a block is deleted.
     */
    @Transactional
    fun deleteAllLayoutsForPage(id: UUID, type: EntityType) {
        layoutRepository.deleteByBlockId(blockId)
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


