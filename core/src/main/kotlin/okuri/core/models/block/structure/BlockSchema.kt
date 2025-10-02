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
 * Convert internal BlockSchema to a JSON Schema 2019-09 Map.
 * - `allowAdditionalProperties` controls object additionalProperties.
 * - Lifts per-field `required=true` into parent "required".
 * - Emits unions (e.g., PERCENTAGE accepts number [0..1] OR string "..%").
 */
fun BlockSchema.toJsonSchema(
    allowAdditionalProperties: Boolean
): Map<String, Any> {
    fun toJs(schema: BlockSchema, allowAP: Boolean): Map<String, Any> {
        return when (schema.type) {
            DataType.OBJECT -> {
                val props = mutableMapOf<String, Any>()
                val requiredKeys = mutableListOf<String>()
                schema.properties?.forEach { (k, v) ->
                    props[k] = toJs(v, allowAP)
                    if (v.required) requiredKeys += k
                }
                buildMap {
                    put("type", "object")
                    put("properties", props)
                    put("additionalProperties", allowAP)
                    if (requiredKeys.isNotEmpty()) put("required", requiredKeys)
                }
            }

            DataType.ARRAY -> {
                val items = schema.items?.let { toJs(it, allowAP) } ?: emptyMap<String, Any>()
                mapOf(
                    "type" to "array",
                    "items" to items
                )
            }

            DataType.STRING -> {
                // Standard formats/patterns
                val base = mutableMapOf<String, Any>("type" to "string")
                when (schema.format) {
                    DataFormat.EMAIL -> base["format"] = "email"
                    DataFormat.PHONE -> base["pattern"] = "^\\+?[1-9]\\d{1,14}\$"
                    DataFormat.CURRENCY -> base["pattern"] = "^[A-Z]{3}\$"
                    DataFormat.PERCENTAGE -> {
                        // Accept string variants like "0%", "20%", "200%", "12.5%"
                        base["pattern"] = "^(\\d+)(\\.\\d+)?%$"
                    }

                    DataFormat.DATE -> base["format"] = "date"
                    DataFormat.DATETIME -> base["format"] = "date-time"
                    DataFormat.URL -> base["format"] = "uri"
                    else -> {}
                }
                base
            }

            DataType.NUMBER -> {
                // For PERCENTAGE, allow numeric 0..1 (interpreted as 0%..100%)
                if (schema.format == DataFormat.PERCENTAGE) {
                    mapOf(
                        "oneOf" to listOf(
                            mapOf(
                                "type" to "number",
                                "minimum" to 0,
                                "maximum" to 1
                            ),
                            mapOf(
                                "type" to "string",
                                "pattern" to "^(\\d+)(\\.\\d+)?%$"
                            )
                        )
                    )
                } else {
                    mapOf("type" to "number")
                }
            }

            DataType.BOOLEAN -> mapOf("type" to "boolean")
            DataType.NULL -> mapOf("type" to "null")
        }
    }

    // Special case: if schema.format == PERCENTAGE, always emit union regardless of declared type.
    return if (this.format == DataFormat.PERCENTAGE) {
        mapOf(
            "oneOf" to listOf(
                mapOf("type" to "number", "minimum" to 0, "maximum" to 1),
                mapOf("type" to "string", "pattern" to "^(\\d+)(\\.\\d+)?%$")
            )
        )
    } else {
        toJs(this, allowAdditionalProperties)
    }
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

