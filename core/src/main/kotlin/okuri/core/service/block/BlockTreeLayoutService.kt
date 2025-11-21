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
     * Extracts all block IDs from a layout, including nested blocks in subGridOpts.
     * This is useful for:
     * - Batch loading blocks
     * - Validating layout integrity
     * - Bulk operations on all blocks in a layout
     *
     * @param treeLayout The BlockTreeLayout to extract IDs from
     * @return Set of all block UUIDs found in the layout structure
     */
    fun extractBlockIdsFromTreeLayout(treeLayout: TreeLayout): Set<UUID> {
        val ids = mutableSetOf<UUID>()

        fun traverseWidgets(widgets: List<okuri.core.models.block.layout.Widget>?) {
            widgets?.forEach { widget ->
                // Extract block ID from widget content
                widget.content?.id?.let { idString ->
                    try {
                        ids.add(UUID.fromString(idString))
                    } catch (e: IllegalArgumentException) {
                        // Skip invalid UUIDs (could be placeholder IDs)
                    }
                }

                // Recursively process nested widgets in subGridOpts
                widget.subGridOpts?.children?.let { nestedChildren ->
                    traverseWidgets(nestedChildren)
                }
            }
        }

        traverseWidgets(treeLayout.children)
        return ids
    }
}


