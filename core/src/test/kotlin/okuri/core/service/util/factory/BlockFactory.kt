package okuri.core.service.util.factory

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.BlockValidationScope
import okuri.core.enums.core.ComponentType
import okuri.core.models.block.structure.*
import java.util.*

object BlockFactory {

    fun generateBlockType(
        orgId: UUID?,
        key: String = "contact_card",
        version: Int = 1,
        scope: BlockValidationScope = BlockValidationScope.SOFT,
        archived: Boolean = false
    ) = BlockTypeEntity(
        id = UUID.randomUUID(),
        key = key,
        displayName = "Contact Card",
        description = null,
        organisationId = orgId,
        system = orgId == null,
        version = version,
        strictness = scope,
        schema = BlockSchema(name = "root"),
        archived = archived,
        displayStructure = BlockDisplay(
            form = BlockFormStructure(emptyMap()),
            render = BlockRenderStructure(ComponentType.TEXT, emptyMap())
        )
    )

    fun generateBlock(
        id: UUID = UUID.randomUUID(),
        orgId: UUID,
        type: BlockTypeEntity,
        name: String? = null,
        data: Map<String, Any?> = emptyMap(),
        parent: BlockEntity? = null
    ) = BlockEntity(
        id = id,
        organisationId = orgId,
        type = type,
        name = name,
        payload = BlockMetadata(data = data, refs = emptyList(), meta = BlockMeta()),
        parent = parent,
        archived = false
    )

    fun generateSchema(): BlockSchema = BlockSchema(name = "root")
    fun generateDisplay(): BlockDisplay = BlockDisplay(
        form = BlockFormStructure(emptyMap()),
        render = BlockRenderStructure(ComponentType.TEXT, emptyMap())
    )
}