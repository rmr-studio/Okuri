package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull

/**
 * Request to move a child block to a different slot or position.
 */
data class MoveChildRequest(
    @field:NotNull
    val toSlot: String,

    @field:NotNull
    val toIndex: Int
)
