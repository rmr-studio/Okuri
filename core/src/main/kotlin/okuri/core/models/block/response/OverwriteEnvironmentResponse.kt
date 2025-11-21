package okuri.core.models.block.response

import okuri.core.models.block.BlockEnvironment

data class OverwriteEnvironmentResponse(
    val success: Boolean,
    val environment: BlockEnvironment
)