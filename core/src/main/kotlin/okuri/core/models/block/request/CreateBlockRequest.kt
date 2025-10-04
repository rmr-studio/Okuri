package okuri.core.models.block.request

import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import java.util.*

/**
 * Request to create a new block.
 * Either typeId or typeKey must be provided to identify the block type.
 */
data class CreateBlockRequest(
    val typeId: UUID? = null,
    val typeKey: String? = null,
    @field:NotNull
    val organisationId: UUID,
    val typeVersion: Int? = null,
    val name: String?,
    @field:NotEmpty
    val payload: Map<String, Any>
) {
    init {
        require(typeId != null || typeKey != null) { "Either typeId or typeKey must be provided" }
    }
}