package okuri.core.service.util.factory.block

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.BlockValidationScope
import okuri.core.enums.core.ComponentType
import okuri.core.models.block.structure.*
import okuri.core.models.common.grid.LayoutGrid
import java.util.*

object BlockFactory {

    fun createType(
        orgId: UUID,
        key: String = "contact_card",
        version: Int = 1,
        strictness: BlockValidationScope = BlockValidationScope.SOFT,
        schema: BlockSchema = BlockSchema(name = "Contact"),
        archived: Boolean = false,
        nesting: BlockTypeNesting = BlockTypeNesting(
            max = null,
            allowedTypes = listOf(ComponentType.CONTACT_CARD)
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
                layoutGrid = LayoutGrid(items = emptyList()),
                components = emptyMap()
            )
        ),
        nesting = nesting
    )

    fun createBlock(
        id: UUID,
        orgId: UUID,
        type: BlockTypeEntity,
        parentId: UUID? = null
    ): BlockEntity = BlockEntity(
        id = id,
        organisationId = orgId,
        type = type,
        name = "Test Block",
        payload = BlockContentMetadata(data = emptyMap(), meta = BlockMeta()),
        parentId = parentId,
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
