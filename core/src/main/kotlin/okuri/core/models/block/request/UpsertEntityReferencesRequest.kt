package okuri.core.models.block.request

import jakarta.validation.constraints.NotNull
import okuri.core.models.block.structure.ReferenceItem

/**
 * Request to update the entity reference list for a reference block.
 */
data class UpsertEntityReferencesRequest(
    @field:NotNull
    val items: List<ReferenceItem>,

    val pathPrefix: String? = null
)
