package okuri.core.service.util.factory.block

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.structure.BlockValidationScope
import okuri.core.enums.core.ComponentType
import okuri.core.models.block.display.BlockComponentNode
import okuri.core.models.block.display.BlockDisplay
import okuri.core.models.block.display.BlockRenderStructure
import okuri.core.models.block.display.BlockTypeNesting
import okuri.core.models.block.metadata.BlockContentMetadata
import okuri.core.models.block.metadata.BlockMeta
import okuri.core.models.block.validation.BlockFormStructure
import okuri.core.models.block.validation.BlockSchema
import okuri.core.models.common.grid.GridItem
import okuri.core.models.common.grid.GridRect
import okuri.core.models.common.grid.LayoutGrid
import java.util.*

object BlockFactory {

    fun createComponent(): BlockComponentNode = BlockComponentNode(
        id = "component_1",
        type = ComponentType.CONTACT_CARD,
        props = mapOf(
            "title" to "Contact Card",
            "showEmail" to true
        )
    )

    fun createType(
        orgId: UUID,
        key: String = "contact_card",
        version: Int = 1,
        strictness: BlockValidationScope = BlockValidationScope.SOFT,
        schema: BlockSchema = BlockSchema(name = "Contact"),
        archived: Boolean = false,
        nesting: BlockTypeNesting = BlockTypeNesting(
            max = null,
            allowedTypes = listOf("contact_card")
        )
    ): BlockTypeEntity = BlockTypeEntity(
        id = UUID.randomUUID(),
        key = key,
        displayName = "Contact",
        description = "Contact type",
        organisationId = orgId,
        system = false,
        version = version,
        strictness = strictness,
        schema = schema,
        archived = archived,
        displayStructure = BlockDisplay(
            form = BlockFormStructure(emptyMap()),
            render = BlockRenderStructure(
                version = 1,
                layoutGrid = LayoutGrid(
                    layout = GridItem(
                        lg = GridRect(
                            x = 0,
                            y = 0,
                            width = 12,
                            height = 12,
                            locked = false,
                            margin = null
                        )
                    ),
                    items = emptyList()
                ),
                components = emptyMap()
            )
        ),
        nesting = nesting
    )

    fun createBlock(
        id: UUID,
        orgId: UUID,
        type: BlockTypeEntity,
    ): BlockEntity = BlockEntity(
        id = id,
        organisationId = orgId,
        type = type,
        name = "Test Block",
        payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
        archived = false
    )


    /**
     * Creates a default root schema for a block.
     *
     * @return A BlockSchema whose name is "root".
     */
    fun generateSchema(): BlockSchema = BlockSchema(name = "root")

    /**
     * Creates a default BlockDisplay with an empty form structure and a text render.
     *
     * @return A BlockDisplay whose form is an empty BlockFormStructure and whose render is a BlockRenderStructure using `ComponentType.TEXT` with no properties.
     */
    fun generateDisplay(): BlockDisplay = BlockDisplayFactory.display(
        render = BlockDisplayFactory.contactWithAccountSummary()
    )
}
