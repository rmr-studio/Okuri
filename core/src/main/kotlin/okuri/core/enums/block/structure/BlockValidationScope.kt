package okuri.core.enums.block.structure

enum class BlockValidationScope {
    SOFT,
    STRICT,
    NONE
}

/**
 * Indicates whether the validation scope is soft.
 *
 * @return `true` if the receiver is `SOFT`, `false` otherwise.
 */
fun BlockValidationScope.isSoft(): Boolean = this == BlockValidationScope.SOFT

/**
 * Determines whether the validation scope is strict.
 *
 * @return `true` if the receiver equals `BlockValidationScope.STRICT`, `false` otherwise.
 */
fun BlockValidationScope.isStrict(): Boolean = this == BlockValidationScope.STRICT