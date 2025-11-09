package okuri.core.models.block.request

import okuri.core.enums.block.structure.BlockValidationScope
import okuri.core.models.block.display.BlockDisplay
import okuri.core.models.block.validation.BlockSchema
import java.util.*

/**
 * Request to create a new block type.
 */
data class CreateBlockTypeRequest(
    // The unique key for the block type.
    val key: String,
    // The name of the block type.
    val name: String,
    // An optional description of the block type.
    val description: String?,
    // The validation mode for the block type.
    val mode: BlockValidationScope = BlockValidationScope.SOFT,
    // The schema defining the structure of the block's data.
    val schema: BlockSchema,
    // The display configuration for rendering the block.
    val display: BlockDisplay,
    // The ID of the organisation creating the block type.
    val organisationId: UUID
)