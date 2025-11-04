package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull
import java.util.*

/**
 * Request to add multiple children to a parent at once.
 */
data class AddChildrenBulkRequest(
    @field:NotNull
    val children: List<ChildOrderItem>
)

data class ChildOrderItem(
    @field:NotNull
    val childId: UUID,

    val orderIndex: Int? = null
)
