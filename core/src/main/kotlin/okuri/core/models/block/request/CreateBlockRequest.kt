package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull
import okuri.core.models.block.display.BlockTypeNesting
import okuri.core.models.block.metadata.Metadata
import java.util.*

/**
 * Request to create a new block.
 * Either typeId or typeKey must be provided to identify the block type.
 * If a parent ID is provided, the new block will be created as a child of that block.
 */
data class CreateBlockRequest(
    @field:NotNull
    var organisationId: UUID,

    // Reference to the Block Type
    val typeId: UUID? = null,
    val typeKey: String? = null,
    val typeVersion: Int? = null,
    val name: String?,

    // Determines the type of block created
    val payload: Metadata,

    // Reference to the parent block and storage requirement if attaching as a child
    val parentId: UUID? = null,
    val parentNesting: BlockTypeNesting? = null,
    val orderIndex: Int? = null,

    ) {
    init {
        require(typeId != null || typeKey != null) { "Either typeId or typeKey must be provided" }
        
        if (orderIndex != null) {
            require(orderIndex >= 0) { "orderIndex must be >= 0" }
        }
    }
}