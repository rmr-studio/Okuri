package okuri.core.models.block.request

import java.util.*

/**
 * Request to create a new block.
 */
data class CreateBlockRequest(
    val typeId: UUID? = null,
    val typeKey: String? = null,
    val organisationId: UUID?,
    val typeVersion: Int? = null,
    val name: String?,
    val payload: Map<String, Any>?
)