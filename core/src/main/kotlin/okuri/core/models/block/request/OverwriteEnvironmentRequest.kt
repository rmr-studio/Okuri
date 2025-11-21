package okuri.core.models.block.request

import okuri.core.models.block.BlockEnvironment
import java.util.*

data class OverwriteEnvironmentRequest(
    val layoutId: UUID,
    val organisationId: UUID,
    val version: Int,
    val environment: BlockEnvironment,
)