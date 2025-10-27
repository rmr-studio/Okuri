package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull
import okuri.core.models.block.structure.ReferenceItem

/**
 * Request to update the single block reference for a reference block.
 */
data class UpsertBlockReferenceRequest(
    @field:NotNull
    val item: ReferenceItem,

    val path: String? = null
)
