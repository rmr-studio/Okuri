package okuri.core.util

import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonNode

/**
 * Safely extracts an enum value from a JsonNode field.
 *
 * @param fieldName The name of the field to extract (e.g., "type")
 * @param targetClass The class being deserialized (for error reporting)
 * @return The enum value
 * @throws com.fasterxml.jackson.databind.JsonMappingException if field is missing or enum value is invalid
 */
inline fun <reified E : Enum<E>> DeserializationContext.getEnumFromField(
    node: JsonNode,
    fieldName: String,
    targetClass: Class<*>
): E {
    val fieldValue = node.get(fieldName)?.asText()
        ?: reportInputMismatch(
            targetClass,
            "Missing '$fieldName' field while deserializing ${targetClass.simpleName}"
        )

    return try {
        enumValueOf<E>(fieldValue)
    } catch (_: IllegalArgumentException) {
        reportInputMismatch(
            targetClass,
            "Unknown ${E::class.java.simpleName} '$fieldValue' while deserializing ${targetClass.simpleName}"
        )
    }
}
