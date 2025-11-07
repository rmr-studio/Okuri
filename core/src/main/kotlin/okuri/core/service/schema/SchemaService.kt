package okuri.core.service.schema

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion
import okuri.core.enums.block.structure.BlockValidationScope
import okuri.core.enums.core.DataFormat
import okuri.core.enums.core.DataType
import okuri.core.models.block.metadata.BlockContentMetadata
import okuri.core.models.block.validation.BlockSchema
import okuri.core.models.block.validation.toJsonSchema
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

    /**
     * Validates a payload against the given BlockSchema and returns any validation error messages.
     *
     * @param schema The BlockSchema describing the expected structure and formats.
     * @param payload The data to validate; may be null.
     * @param scope Validation strictness: `NONE` skips validation and returns an empty list; `SOFT` relaxes property checks.
     * @param path Root path used in recursive error messages (default "$").
     * @return A list of validation error messages; empty if no validation issues were found.
     */
    fun validate(
        schema: BlockSchema,
        payload: BlockContentMetadata,
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

    /**
     * Validates a payload against a BlockSchema and throws when validation fails in strict mode.
     *
     * @param schema The schema to validate against.
     * @param payload The value to validate; may be null.
     * @param scope The validation scope that controls strictness (errors only cause an exception when `STRICT`).
     * @throws SchemaValidationException if `scope` is `STRICT` and validation produced one or more errors; the exception's `reasons` list contains the error messages.
     */
    fun validateOrThrow(
        schema: BlockSchema,
        payload: BlockContentMetadata,
        scope: BlockValidationScope
    ) {
        val errs = validate(schema, payload, scope)
        if (scope == BlockValidationScope.STRICT && errs.isNotEmpty()) {
            throw SchemaValidationException(errs)
        }
    }


    /**
     * Recursively validates a runtime payload against a BlockSchema and accumulates validation messages.
     *
     * Performs type checks, required-field checks, per-type recursive validation for objects and arrays,
     * and format/number validations for strings and numbers. Respects soft single-item array heuristics
     * when scope is SOFT and stops accumulating further detailed errors once MAX_ERRORS is reached.
     *
     * @param schema The BlockSchema describing expected structure and constraints for this node.
     * @param payload The runtime value to validate; may be null.
     * @param path JSON-path-like location of the payload within the root document (e.g., "$", "$/user", "$/items[0]").
     * @param scope Validation scope that can alter permissiveness (e.g., SOFT allows single-item array heuristics).
     * @param acc Mutable list used to collect error messages; pass an existing list to accumulate across recursive calls.
     * @return The same mutable list passed as `acc`, containing any validation error messages collected for this subtree.
     */
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
                    if (!mapPayload.containsKey(key)) {
                        if (childSchema.required) acc += "Missing required value at $path/$key"
                        return@forEach
                    }
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

    /**
     * Heuristically determines whether a non-list payload can be treated as a single array item
     * by checking if the payload's runtime type matches the expected item schema type.
     *
     * @param itemSchema The schema describing the expected item type.
     * @param payload The value to test against the item schema's type.
     * @return `true` if the payload's runtime type corresponds to `itemSchema.type`, `false` otherwise.
     */
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

    /**
     * Validates a string value against the format declared in the provided schema.
     *
     * Supports EMAIL, CURRENCY, PHONE, PERCENTAGE, DATE, DATETIME, and URL formats; returns null when the value conforms.
     *
     * @param schema The BlockSchema whose `format` determines which validation to apply.
     * @param value The string value to validate.
     * @param path The JSON path used in returned error messages when validation fails.
     * @return An error message describing the format violation (including `path`), or `null` if the value is valid.
     */
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

    /**
     * Validates a numeric value against the schema's numeric format constraints.
     *
     * @param schema The block schema that may declare a numeric format (e.g., percentage).
     * @param value The numeric value from the payload to validate.
     * @param path The JSON-like path to the value, used for error messages.
     * @return An error message describing the format violation, or `null` if the value satisfies the schema.
     */
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