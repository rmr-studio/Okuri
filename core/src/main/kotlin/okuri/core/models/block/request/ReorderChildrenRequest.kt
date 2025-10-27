package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull
import java.util.*

/**
 * Request to reorder children within a single slot.
 */
data class ReorderChildrenRequest(
    @field:NotNull
    val slot: String,

    @field:NotNull
    val order: List<UUID>
)
