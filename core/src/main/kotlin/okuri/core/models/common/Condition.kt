package okuri.core.models.common

/** Simple boolean predicate */
data class Condition(
    val op: Op,
    val left: Operand,
    val right: Operand? = null
)

enum class Op { EXISTS, EQUALS, NOT_EQUALS, GT, GTE, LT, LTE, IN, NOT_IN, EMPTY, NOT_EMPTY }
sealed class Operand {
    data class Path(val path: String) : Operand()       // same JSONPath-ish as DataPath
    data class Value(val value: Any?) : Operand()
}
