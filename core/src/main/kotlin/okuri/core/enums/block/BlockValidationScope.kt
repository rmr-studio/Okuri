package okuri.core.enums.block

enum class BlockValidationScope {
    SOFT,
    STRICT,
    NONE
}

fun BlockValidationScope.isSoft(): Boolean = this == BlockValidationScope.SOFT
fun BlockValidationScope.isStrict(): Boolean = this == BlockValidationScope.STRICT
