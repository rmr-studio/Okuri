package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull

/**
 * Request to move a child block to a different position.
 */
data class MoveChildRequest(
    @field:NotNull
    val toIndex: Int
)
