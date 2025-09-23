package okuri.core.models.block.structure

import okuri.core.enums.core.ComponentType

/**
 * Defines the UI Structure of the Component used to display the data stored in a block
 *   - The type of component (e.g., card, list, table)
 *   - The fields to be displayed
 *   - The order of fields
 *   - Any additional formatting or styling options
 *
 * The properties should match all keys defined in the BlockSchema for the block
 *
 * {
 *   "component": "CONTACT_CARD",
 *   "fields": {
 *     "name": { "key: "name", "component": "LABEL", "props": { "text": "Name" } },
 *     "address": { "key: "address", "component": "ADDRESS_CARD", "props": { "street": "......" } },
 *     "email": { "key: "email", "component": "LABEL", "props": { "text": "Email" } },
 *     "phone": { "key: "phone", "component": "LABEL", "props": { "text": "Phone" } }
 *   }
 * }
 *
 */

data class BlockRenderStructure(
    val component: ComponentType,
    val fields: Map<String, BlockRenderField>
)

data class BlockRenderField(
    val key: String,
    val component: ComponentType,
    val props: Map<String, Any>? = null
)