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
import java.net.URI
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.format.DateTimeParseException

class SchemaValidationException(val reasons: List<String>) :
    RuntimeException("Schema validation failed: ${reasons.joinToString("; ")}")

// Add near the top-level class
private const val MAX_ERRORS = 200

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

        // Step 1: JSON Schema (structural)
        val schemaMap = schema.toJsonSchema(allowAdditionalProperties = scope == BlockValidationScope.SOFT)
        val schemaNode: JsonNode = objectMapper.valueToTree(schemaMap)
        val payloadNode: JsonNode = objectMapper.valueToTree(payload)
        val jsonSchema = schemaFactory.getSchema(schemaNode)
        jsonSchema.validate(payloadNode).forEach { errors.add(it.message) }

        // Step 2: Custom recursive checks
        errors += validateRecursive(schema, payload, path, scope)

        return errors
    }

    fun validateOrThrow(
        schema: BlockSchema,
        payload: Any?,
        scope: BlockValidationScope
    ) {
        val errs = validate(schema, payload, scope)
        if (scope == BlockValidationScope.STRICT && errs.isNotEmpty()) {
            throw SchemaValidationException(errs)
        }
    }


    private fun validateRecursive(
        schema: BlockSchema,
        payload: Any?,
        path: String,
        scope: BlockValidationScope,
        acc: MutableList<String> = mutableListOf()
    ): List<String> {

        fun hasReachedLimit() = acc.size >= MAX_ERRORS

        if (payload == null) {
            if (schema.type != DataType.NULL)
                acc += "Invalid type at $path: expected ${schema.type.name.lowercase()}, got null"

            if (schema.required) acc += "Missing required value at $path"
            return acc
        } else {
            if (schema.type == DataType.NULL) {
                acc += "Invalid type at $path: expected null, got ${payload::class.simpleName}"
                return acc
            }
        }

        when (schema.type) {
            DataType.OBJECT -> {
                val mapPayload = payload as? Map<*, *>
                if (mapPayload == null) {
                    acc += "Invalid type at $path: expected object, got ${payload::class.simpleName}"
                    // Helpful but non-noisy: surface required keys, don’t recurse formats
                    schema.properties?.forEach { (k, v) -> if (v.required) acc += "Missing required value at $path/$k" }
                    return acc
                }
                schema.properties?.forEach { (key, childSchema) ->
                    if (hasReachedLimit()) return acc
                    val value = mapPayload[key]
                    validateRecursive(childSchema, value, "$path/$key", scope, acc)
                }
            }

            DataType.ARRAY -> {
                val listPayload = payload as? List<*>
                if (listPayload == null) {
                    acc += "Invalid type at $path: expected array, got ${payload::class.simpleName}"
                    // SOFT guardrail: if this *looks like* a single item of the array, validate it once
                    if (scope == BlockValidationScope.SOFT && schema.items != null &&
                        looksLikeSingleItem(schema.items, payload)
                    ) {
                        validateRecursive(schema.items, payload, "$path[0?] (soft single-item check)", scope, acc)
                    }
                    return acc
                }
                val itemSchema = schema.items
                if (itemSchema != null) {
                    listPayload.forEachIndexed { idx, item ->
                        if (hasReachedLimit()) return acc
                        validateRecursive(itemSchema, item, "$path[$idx]", scope, acc)
                    }
                }
            }

            DataType.STRING -> {
                if (payload !is String) {
                    acc += "Invalid type at $path: expected string, got ${payload::class.simpleName}"
                    return acc
                }
                validateStringFormat(schema, payload, path)?.let { acc += it }
            }

            DataType.NUMBER -> {
                if (payload !is Number) {
                    acc += "Invalid type at $path: expected number, got ${payload::class.simpleName}"
                    return acc
                }
                validateNumberFormat(schema, payload.toDouble(), path)?.let { acc += it }
            }

            DataType.BOOLEAN -> {
                if (payload !is Boolean) {
                    acc += "Invalid type at $path: expected boolean, got ${payload::class.simpleName}"
                }
            }

            else -> {
                // NULL type already handled above

            }
        }

        return acc
    }

    private fun looksLikeSingleItem(itemSchema: BlockSchema, payload: Any?): Boolean {
        return when (itemSchema.type) {
            DataType.OBJECT -> payload is Map<*, *>
            DataType.ARRAY -> payload is List<*>          // unlikely, but keep symmetrical
            DataType.STRING -> payload is String
            DataType.NUMBER -> payload is Number
            DataType.BOOLEAN -> payload is Boolean
            DataType.NULL -> payload == null
        }
    }

    private fun validateStringFormat(schema: BlockSchema, value: String, path: String): String? {
        return when (schema.format) {
            DataFormat.EMAIL ->
                if (!value.matches(Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+\$"))) "Invalid email format at $path" else null

            DataFormat.CURRENCY ->
                if (!value.matches(Regex("^[A-Z]{3}\$"))) "Invalid currency format at $path (expected 3-letter ISO code)" else null

            DataFormat.PHONE ->
                if (!value.matches(Regex("^\\+?[1-9]\\d{1,14}\$"))) "Invalid phone format at $path (expected E.164)" else null

            DataFormat.PERCENTAGE -> {
                // Strings must include '%' (multi-digit allowed): e.g., "20%", "200%", "12.5%"
                if (!value.matches(Regex("^(\\d+)(\\.\\d+)?%\$")))
                    "Invalid percentage string at $path (expected e.g. 20% or 12.5%)" else null
            }

            DataFormat.DATE -> {
                try {
                    LocalDate.parse(value); null
                } catch (_: DateTimeParseException) {
                    "Invalid date (ISO-8601) at $path"
                }
            }

            DataFormat.DATETIME -> {
                try {
                    OffsetDateTime.parse(value); null
                } catch (_: DateTimeParseException) {
                    "Invalid date-time (ISO-8601) at $path"
                }
            }

            DataFormat.URL -> {
                try {
                    val uri = URI(value)
                    if (uri.scheme.isNullOrBlank() || uri.host.isNullOrBlank()) "Invalid URL at $path" else null
                } catch (_: Exception) {
                    "Invalid URL at $path"
                }
            }

            else -> null
        }
    }

    private fun validateNumberFormat(schema: BlockSchema, value: Double, path: String): String? {
        return when (schema.format) {
            DataFormat.PERCENTAGE -> {
                // Numeric variants must be in [0, 1]
                if (value < 0.0 || value > 1.0) "Invalid percentage number at $path (expected 0..1 for 0%..100%)" else null
            }

            else -> null
        }
    }
}
