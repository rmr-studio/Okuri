package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull
import java.util.*

/**
 * Request to add a single child block to a parent's slot.
 */
data class AddChildRequest(
    @field:NotNull
    val childId: UUID,

    @field:NotNull
    val slot: String,

    val orderIndex: Int? = null
)
