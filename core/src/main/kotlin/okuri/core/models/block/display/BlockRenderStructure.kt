package okuri.core.models.block.display

import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockFetchPolicy
import okuri.core.enums.core.ComponentType
import okuri.core.models.common.Condition
import okuri.core.models.common.grid.LayoutGrid
import okuri.core.models.common.json.JsonObject
import okuri.core.models.common.theme.ThemeTokens

/**
 * Defines the UI Structure of the Component used to display the data stored in a block
 **/

data class BlockRenderStructure(
    val version: Int = 1,
    // Defines internal initial layout of the block
    val layoutGrid: LayoutGrid,
    val components: Map<String, BlockComponentNode> = emptyMap(),
    val theme: ThemeTokens? = null,
)

data class BlockComponentNode(
    val id: String,
    val type: ComponentType,
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val props: JsonObject = mapOf(),
    val bindings: List<BlockBinding> = emptyList(),
    val slots: Map<String, List<String>>? = null, // slotKey -> [childComponentId,...]
    val slotLayout: Map<String, LayoutGrid>? = null, // slotKey -> LayoutGrid
    val widgetMeta: JsonObject? = null,
    val visible: Condition? = null, // visibility condition
    val fetchPolicy: BlockFetchPolicy = BlockFetchPolicy.LAZY // data fetching policy (for refs)
)



