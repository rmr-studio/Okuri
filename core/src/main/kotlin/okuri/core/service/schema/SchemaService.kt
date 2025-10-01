package okuri.core.service.schema

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion
import okuri.core.enums.block.BlockValidationScope
import okuri.core.enums.core.DataFormat
import okuri.core.enums.core.DataType
import okuri.core.models.block.structure.BlockSchema
import okuri.core.models.block.structure.toJsonSchema
import org.springframework.stereotype.Service

@Service
class SchemaService(
    private val objectMapper: ObjectMapper
) {
    private val schemaFactory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V201909)

    fun validate(
        schema: BlockSchema,
        payload: Any?,
        scope: BlockValidationScope = BlockValidationScope.STRICT,
        path: String = "$"
    ): List<String> {
        if (scope == BlockValidationScope.NONE) return emptyList()

        val errors = mutableListOf<String>()

        // Step 1: Structural validation with JSON Schema
        val schemaMap = schema.toJsonSchema(allowAdditionalProperties = scope == BlockValidationScope.SOFT)
        val schemaNode: JsonNode = objectMapper.valueToTree(schemaMap)
        val payloadNode: JsonNode = objectMapper.valueToTree(payload)

        val jsonSchema = schemaFactory.getSchema(schemaNode)
        val structuralErrors = jsonSchema.validate(payloadNode)
        structuralErrors.forEach { errors.add(it.message) }

        // Step 2: Custom recursive validation (formats + lenience)
        errors += validateRecursive(schema, payload, path, scope)

        return errors
    }

    private fun validateRecursive(
        schema: BlockSchema,
        payload: Any?,
        path: String,
        scope: BlockValidationScope
    ): List<String> {
        val errors = mutableListOf<String>()

        if (payload == null) {
            if (schema.required) {
                errors.add("Missing required value at $path")
            }
            return errors
        }

        when (schema.type) {
            DataType.OBJECT -> {
                val mapPayload = payload as? Map<*, *>
                if (mapPayload == null) {
                    errors.add("Invalid type at $path: expected object, got ${payload::class.simpleName}")
                    if (scope == BlockValidationScope.SOFT) {
                        schema.properties?.forEach { (key, childSchema) ->
                            val value = (payload as? Map<*, *>)?.get(key)
                            errors += validateRecursive(childSchema, value, "$path/$key", scope)
                        }
                    }
                } else {
                    schema.properties?.forEach { (key, childSchema) ->
                        val value = mapPayload[key]
                        errors += validateRecursive(childSchema, value, "$path/$key", scope)
                    }
                }
            }

            DataType.ARRAY -> {
                val listPayload = payload as? List<*>
                if (listPayload == null) {
                    errors.add("Invalid type at $path: expected array, got ${payload::class.simpleName}")
                    if (scope == BlockValidationScope.SOFT) {
                        schema.items?.let {
                            errors += validateRecursive(it, payload, "$path[0?]", scope)
                        }
                    }
                } else {
                    listPayload.forEachIndexed { idx, item ->
                        schema.items?.let {
                            errors += validateRecursive(it, item, "$path[$idx]", scope)
                        }
                    }
                }
            }

            DataType.STRING -> {
                if (payload !is String) {
                    errors.add("Invalid type at $path: expected string, got ${payload::class.simpleName}")
                } else {
                    validateFormat(schema, payload, path)?.let { errors.add(it) }
                }
            }

            DataType.NUMBER -> {
                if (payload !is Number) {
                    errors.add("Invalid type at $path: expected number, got ${payload::class.simpleName}")
                }
            }

            DataType.BOOLEAN -> {
                if (payload !is Boolean) {
                    errors.add("Invalid type at $path: expected boolean, got ${payload::class.simpleName}")
                }
            }

            DataType.NULL -> {
                if (payload != null) {
                    errors.add("Invalid type at $path: expected null, got ${payload::class.simpleName}")
                }
            }
        }

        return errors
    }

    private fun validateFormat(schema: BlockSchema, value: String, path: String): String? {
        return when (schema.format) {
            DataFormat.EMAIL -> if (!value.matches(Regex("^[^@]+@[^@]+\\.[^@]+$"))) {
                "Invalid email format at $path"
            } else null

            DataFormat.CURRENCY -> if (!value.matches(Regex("^[A-Z]{3}$"))) {
                "Invalid currency format at $path (expected 3-letter ISO code)"
            } else null

            DataFormat.PHONE -> if (!value.matches(Regex("^\\+?[1-9]\\d{1,14}$"))) {
                "Invalid phone format at $path (expected E.164 format)"
            } else null

            DataFormat.PERCENTAGE -> if (!value.matches(Regex("^(100|[0-9]{1,2})(\\.\\d+)?%$"))) {
                "Invalid percentage format at $path"
            } else null

            else -> null
        }
    }
}
