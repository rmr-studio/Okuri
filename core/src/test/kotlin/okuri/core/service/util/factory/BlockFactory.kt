package okuri.core.service.util.factory

import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.BlockValidationScope
import okuri.core.enums.core.ComponentType
import okuri.core.models.block.structure.*
import java.util.*

object BlockFactory {

    /**
     * Creates a BlockTypeEntity populated with sensible defaults, allowing overrides for organisation, key, version, validation scope, and archived state.
     *
     * @param orgId The organisation UUID; pass `null` to mark the block type as a system-level type.
     * @param key The block type key (defaults to "contact_card").
     * @param version The block type version.
     * @param scope The validation strictness for the block type.
     * @param archived Whether the block type is archived.
     * @return A new BlockTypeEntity configured with the provided values and default schema and display structures.
     */
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

    /**
     * Create a BlockEntity linked to the given BlockTypeEntity.
     *
     * @param id Optional identifier for the block; a random UUID is generated when omitted.
     * @param orgId Organisation identifier that owns the block.
     * @param type The BlockTypeEntity that defines this block's type.
     * @param name Optional human-readable name for the block.
     * @param data Initial payload data for the block; stored in the block's metadata.
     * @param parent Optional parent block to establish hierarchy.
     * @return The constructed BlockEntity whose payload contains the provided `data`, an empty `refs` list, and a default `BlockMeta`.
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
    fun generateDisplay(): BlockDisplay = BlockDisplay(
        form = BlockFormStructure(emptyMap()),
        render = BlockRenderStructure(ComponentType.TEXT, emptyMap())
    )
}