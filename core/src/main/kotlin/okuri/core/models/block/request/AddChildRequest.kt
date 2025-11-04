package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull
import java.util.*

/**
 * Request to add a single child block to a parent.
 */
data class AddChildRequest(
    @field:NotNull
    val childId: UUID,

    val orderIndex: Int? = null
)
