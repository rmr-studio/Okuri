package okuri.core.service.block

import okuri.core.entity.block.BlockTreeLayoutEntity
import okuri.core.enums.block.layout.RenderType
import okuri.core.enums.block.node.NodeType
import okuri.core.enums.core.EntityType
import okuri.core.models.block.layout.RenderContent
import okuri.core.models.block.layout.TreeLayout
import okuri.core.models.block.layout.Widget
import okuri.core.models.block.layout.options.BreakpointConfig
import okuri.core.models.block.layout.options.ColumnOptions
import okuri.core.models.block.layout.options.DraggableOptions
import okuri.core.models.block.layout.options.ResizableOptions
import okuri.core.models.block.tree.BlockTreeLayout
import okuri.core.repository.block.BlockTreeLayoutRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*

/**
 * Service for creating default block environments for entities.
 * Handles lazy initialization of block layouts when entities are first accessed.
 */
@Service
class DefaultBlockEnvironmentService(
    private val blockTreeLayoutRepository: BlockTreeLayoutRepository,
) {

    /**
     * Creates a default block environment for an entity.
     * This includes:
     * 1. A default TreeLayout with Gridstack configuration
     * 2. A reference block (marked as non-deletable)
     * 3. Optional starter blocks (to be implemented)
     *
     * @param entityId The ID of the entity (e.g., client ID)
     * @param entityType The type of entity (e.g., CLIENT, ORGANISATION)
     * @param organisationId The organisation this entity belongs to
     * @return The created BlockTreeLayout model
     */
    @Transactional
    fun createDefaultEnvironmentForEntity(
        entityId: UUID,
        entityType: EntityType,
        organisationId: UUID
    ): BlockTreeLayout {
        // Check if layout already exists
        blockTreeLayoutRepository.findByEntityIdAndEntityType(entityId, entityType)
            .ifPresent {
                throw IllegalStateException(
                    "Layout already exists for ${entityType.type} $entityId"
                )
            }

        // Build default layout based on entity type
        val defaultLayout = buildDefaultLayoutForEntityType(entityId, entityType)

        // Persist layout entity
        val layoutEntity = BlockTreeLayoutEntity(
            entityId = entityId,
            entityType = entityType,
            organisationId = organisationId,
            layout = defaultLayout,
            version = 1
        )

        return blockTreeLayoutRepository.save(layoutEntity).toModel()
    }

    /**
     * Builds a default TreeLayout structure based on entity type.
     * Currently returns an empty layout with grid configuration.
     *
     * TODO: Implement reference block and starter blocks creation
     * TODO: Add entity-specific layout templates
     */
    private fun buildDefaultLayoutForEntityType(
        entityId: UUID,
        entityType: EntityType
    ): TreeLayout {
        return when (entityType) {
            EntityType.CLIENT -> buildDefaultClientLayout(entityId)
            EntityType.ORGANISATION -> buildDefaultOrganisationLayout(entityId)
            EntityType.PROJECT -> buildDefaultProjectLayout(entityId)
            EntityType.INVOICE -> buildDefaultInvoiceLayout(entityId)
            else -> buildGenericDefaultLayout(entityId)
        }
    }

    /**
     * Builds default layout for CLIENT entities.
     *
     * Layout structure:
     * - Reference block at top (full width)
     * - Empty space for user-added blocks
     */
    private fun buildDefaultClientLayout(entityId: UUID): TreeLayout {
        val widgets = mutableListOf<Widget>()

        // TODO: Create actual reference block and add to widgets
        // For now, return empty layout with proper grid configuration
        // widgets.add(createReferenceBlockWidget(entityId, EntityType.CLIENT))

        return TreeLayout(
            resizable = ResizableOptions(handles = "se, sw"),
            draggable = DraggableOptions(cancel = ".block-no-drag", pause = 5),
            cellHeight = 25,
            column = 23,
            columnOpts = ColumnOptions(
                breakpoints = listOf(
                    BreakpointConfig(width = 1024, columns = 12),
                    BreakpointConfig(width = 768, columns = 1)
                )
            ),
            animate = true,
            acceptWidgets = true,
            children = if (widgets.isEmpty()) null else widgets
        )
    }

    /**
     * Builds default layout for ORGANISATION entities.
     */
    private fun buildDefaultOrganisationLayout(entityId: UUID): TreeLayout {
        // Similar structure to client layout
        return buildGenericDefaultLayout(entityId)
    }

    /**
     * Builds default layout for PROJECT entities.
     */
    private fun buildDefaultProjectLayout(entityId: UUID): TreeLayout {
        return buildGenericDefaultLayout(entityId)
    }

    /**
     * Builds default layout for INVOICE entities.
     */
    private fun buildDefaultInvoiceLayout(entityId: UUID): TreeLayout {
        return buildGenericDefaultLayout(entityId)
    }

    /**
     * Generic default layout template used as fallback.
     */
    private fun buildGenericDefaultLayout(entityId: UUID): TreeLayout {
        return TreeLayout(
            resizable = ResizableOptions(handles = "se, sw"),
            draggable = DraggableOptions(cancel = ".block-no-drag", pause = 5),
            cellHeight = 25,
            column = 23,
            columnOpts = ColumnOptions(
                breakpoints = listOf(
                    BreakpointConfig(width = 1024, columns = 12),
                    BreakpointConfig(width = 768, columns = 1)
                )
            ),
            animate = true,
            acceptWidgets = true,
            children = null  // Empty layout initially
        )
    }

    /**
     * Creates a reference block widget for the layout.
     * Reference blocks display entity data and are marked as non-deletable.
     *
     * TODO: Implement actual block creation
     * TODO: Store deletable=false metadata
     */
    private fun createReferenceBlockWidget(
        entityId: UUID,
        entityType: EntityType
    ): Widget {
        // Generate a deterministic ID for the reference block
        val referenceBlockId = "ref-${entityType.type.lowercase()}-$entityId"

        return Widget(
            id = referenceBlockId,
            x = 0,
            y = 0,
            w = 12,
            h = 6,
            locked = false,
            content = RenderContent(
                id = referenceBlockId,
                key = "reference",
                renderType = RenderType.COMPONENT,
                blockType = NodeType.REFERENCE_NODE
            )
        )
    }

    /**
     * Creates starter blocks for an entity.
     * Starter blocks help users get started with common block types.
     *
     * TODO: Implement based on user requirements
     * TODO: Add entity-specific starter blocks
     */
    private fun createStarterBlocks(
        entityId: UUID,
        entityType: EntityType,
        organisationId: UUID
    ): List<Widget> {
        // Placeholder for future implementation
        return emptyList()
    }
}
