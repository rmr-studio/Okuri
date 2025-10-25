package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull
import okuri.core.models.block.structure.Metadata
import java.util.*

/**
 * Request to create a new block.
 * Either typeId or typeKey must be provided to identify the block type.
 * If a parent ID is provided, the new block will be created as a child of that block.
 */
data class CreateBlockRequest(
    @field:NotNull
    var organisationId: UUID,
    val parentId: UUID? = null,
    val typeId: UUID? = null,
    val typeKey: String? = null,
    val typeVersion: Int? = null,
    val name: String?,
    // Determines the type of block created
    val payload: Metadata
) {
    init {
        require(typeId != null || typeKey != null) { "Either typeId or typeKey must be provided" }
    }
}