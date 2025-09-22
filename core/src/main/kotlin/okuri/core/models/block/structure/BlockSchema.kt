package okuri.core.models.block.structure

import okuri.core.enums.block.DataType

/**
 * The Block Schema defines the structure and data storage requirements for a given block.
 *
 * Example JSON Schema:
 * {
 *   "type": "object",
 *   "properties": {
 *     "contacts": {
 *       "type": "array",
 *       "items": {
 *         "type": "object",
 *         "properties": {
 *           "name": { "type": "string" },
 *           "email": { "type": "string", "format": "email" },
 *           "role": { "type": "string" },
 *           "phone": { "type": "string" }
 *         },
 *         "required": ["name", "email"]
 *       }
 *     }
 *   },
 *   "required": ["contacts"]
 * }
 */
data class BlockSchema(
    val name: String,
    val description: String? = null,
    val type: DataType = DataType.OBJECT,
    val required: Boolean = false,
    val properties: Map<String, BlockSchema>? = null,
    val items: BlockSchema? = null
)

