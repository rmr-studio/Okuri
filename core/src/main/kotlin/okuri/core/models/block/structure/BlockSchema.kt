package okuri.core.models.block.structure

import com.fasterxml.jackson.databind.JsonNode
import okuri.core.enums.core.DataFormat
import okuri.core.enums.core.DataType

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
    val format: DataFormat? = null,
    val required: Boolean = false,
    val properties: Map<String, BlockSchema>? = null,
    val items: BlockSchema? = null
)

/**
 * Convert BlockSchema to a JSON Schema compatible map.
 * This is so we can leverage existing JSON Schema validation libraries
 * And have an in-house validation schema
 */
fun BlockSchema.toJsonSchema(allowAdditionalProperties: Boolean = true): Map<String, Any?> {
    val schema = mutableMapOf<String, Any?>(
        "type" to type.jsonValue
    )

    description?.let { schema["description"] = it }

    if (type == DataType.OBJECT) {
        properties?.let {
            schema["properties"] = it.mapValues { (_, v) -> v.toJsonSchema(allowAdditionalProperties) }
            val requiredProps = it.filterValues { v -> v.required }.keys
            if (requiredProps.isNotEmpty()) {
                schema["required"] = requiredProps.toList()
            }
        }
        // Disallow properties not explicitly defined
        schema["additionalProperties"] = allowAdditionalProperties
    }

    if (type == DataType.ARRAY) {
        items?.let {
            schema["items"] = it.toJsonSchema()
        }
    }

    return schema
}

/**
 * Convert a JsonNode representing a JSON Schema into a BlockSchema.
 * This is so we can easily import JSON Schemas from external sources.
 */
fun JsonNode.toBlockSchema(): BlockSchema {
    val type = this["type"]?.asText()?.let { DataType.valueOf(it.uppercase()) } ?: DataType.OBJECT
    val format = this["format"]?.asText()?.let {
        DataFormat.entries.find { f -> f.jsonValue == it }
    }

    val props = this["properties"]?.fields()?.asSequence()?.map { (k, v) ->
        k to v.toBlockSchema()
    }?.toMap()

    val required = this["required"]?.map { it.asText() }?.toSet() ?: emptySet()

    return BlockSchema(
        name = this["title"]?.asText() ?: "Unnamed",
        description = this["description"]?.asText(),
        type = type,
        format = format,
        required = false, // handled via required list
        properties = props?.mapValues { (k, v) ->
            v.copy(required = required.contains(k))
        },
        items = this["items"]?.toBlockSchema()
    )
}

