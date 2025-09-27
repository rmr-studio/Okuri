package okuri.core.models.block.request

/**
 * Request to create a new block.
 */
data class CreateBlockRequest(
    // The key of the block type to use for this block.
    val key: String,
    val organisationId: String?,
    val name: String?,
    val payload: Map<String, Any>?,
    val schemaOverride: Boolean = false,
)