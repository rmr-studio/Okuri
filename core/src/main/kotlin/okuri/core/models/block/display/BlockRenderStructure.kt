package okuri.core.models.block.display

import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.node.BlockFetchPolicy
import okuri.core.enums.core.ComponentType
import okuri.core.models.common.Condition
import okuri.core.models.common.grid.LayoutGrid
import okuri.core.models.common.json.JsonObject
import okuri.core.models.common.theme.ThemeTokens

/**
 * Defines the UI Structure of the Component used to display the data stored in a block
 **/

/**
 * The overall structure of a block's renderable components and layout
 * The 'components' map contains all the components that can be referenced in the layout grid
 *
 * * Example:
 * {
 *   "header_text": {
 *    "id": "header_text",
 *    "type": "TEXT",
 *    "props": { "variant": "h3" },
 *    "bindings": [ { "type": "data", "prop": "text",
 *    "path": "$.data/title" } ],
 *    "visible": { "type": "exists", "path": "$.data/title" }
 *   },
 *   "lines": {
 *      "id": "lines",
 *      "type": "TABLE",
 *      "props": {
 *          "columns": [
 *              { "key": "name", "label": "Name" },
 *              { "key": "qty", "label": "Qty" },
 *              { "key": "price", "label": "Price" }]
 *              },
 *      "bindings": [ { "type": "data", "prop": "rows", "path": "$.data/lineItems" } ]},
 *   "card": {
 *          "id": "card",
 *          "type": "CARD",
 *          "props": { "elevated": true },
 *          "slots": {
 *              "header": [ "header_text" ],
 *              "body": [ "lines" ]
 *          }}}
 * }
 *
 * The 'layoutGrid' defines how the components are arranged visually
 * Example:
 *  layoutGrid = LayoutGrid(items = listOf(item("card", lg(0, 0, 12, 10)))),
 * So when rendering. the system will render the 'card' component in a grid, and given the card stores the `lines` and `header` in its slots, those will be rendered inside the card accordingly.
 **/

data class BlockRenderStructure(
    val version: Int = 1,
    val layoutGrid: LayoutGrid,
    val components: Map<String, BlockComponentNode> = mapOf(), // componentId -> BlockComponentNode
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



