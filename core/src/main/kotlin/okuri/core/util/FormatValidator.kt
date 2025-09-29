package okuri.core.util

import okuri.core.enums.core.DataFormat

object FormatValidator {
    private val currencyRegex = Regex("^[A-Z]{3}$") // e.g. USD, AUD, EUR
    private val phoneRegex = Regex("^\\+?[1-9]\\d{1,14}\$") // E.164
    private val percentageRegex = Regex("^(100|[0-9]{1,2})(\\.\\d+)?%?\$")

    val validators: Map<DataFormat, (Any?) -> Boolean> = mapOf(
        DataFormat.CURRENCY to { v -> v is String && currencyRegex.matches(v) },
        DataFormat.PHONE to { v -> v is String && phoneRegex.matches(v) },
        DataFormat.PERCENTAGE to { v ->
            when (v) {
                is Number -> v.toDouble() in 0.0..100.0
                is String -> percentageRegex.matches(v)
                else -> false
            }
        }
    )
}