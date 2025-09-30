package okuri.core.util

import okuri.core.enums.core.DataFormat
import java.net.URI
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeParseException

object FormatValidator {
    private val currencyRegex = Regex("^[A-Z]{3}$") // e.g. USD, AUD, EUR
    private val phoneRegex = Regex("^\\+?[1-9]\\d{1,14}\$") // E.164 format
    private val percentageRegex = Regex("^(100|[0-9]{1,2})(\\.\\d+)?%?\$")
    private val emailRegex = Regex("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")

    private val registry: MutableMap<DataFormat, (Any?) -> Boolean> = mutableMapOf(
        DataFormat.CURRENCY to { v -> v is String && currencyRegex.matches(v) },

        DataFormat.PHONE to { v -> v is String && phoneRegex.matches(v) },

        DataFormat.PERCENTAGE to { v ->
            when (v) {
                is Number -> v.toDouble() in 0.0..100.0
                is String -> percentageRegex.matches(v)
                else -> false
            }
        },

        DataFormat.EMAIL to { v -> v is String && emailRegex.matches(v) },

        DataFormat.DATE to { v ->
            if (v !is String) false
            else try {
                LocalDate.parse(v, DateTimeFormatter.ISO_DATE)
                true
            } catch (_: DateTimeParseException) {
                false
            }
        },

        DataFormat.DATETIME to { v ->
            if (v !is String) false
            else try {
                OffsetDateTime.parse(v, DateTimeFormatter.ISO_DATE_TIME)
                true
            } catch (_: DateTimeParseException) {
                false
            }
        },

        DataFormat.URL to { v ->
            if (v !is String) false
            else try {
                val uri = URI(v)
                uri.scheme != null && uri.host != null
            } catch (_: Exception) {
                false
            }
        }
    )

    /**
     * Validate a value against the given [DataFormat].
     */
    fun validate(format: DataFormat, value: Any?): Boolean {
        return registry[format]?.invoke(value) ?: true // fallback = no validator
    }

    /**
     * Register or override a validator for a [DataFormat].
     */
    fun register(format: DataFormat, validator: (Any?) -> Boolean) {
        registry[format] = validator
    }

    /**
     * Remove a validator (use with caution).
     */
    fun unregister(format: DataFormat) {
        registry.remove(format)
    }

    /**
     * Expose all available formats for introspection (useful for debugging).
     */
    fun availableFormats(): Set<DataFormat> = registry.keys
}


