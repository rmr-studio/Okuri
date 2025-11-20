package okuri.core.models.block.response

import java.time.ZonedDateTime

data class SaveEnvironmentResponse(
    val success: Boolean,
    val error: String? = null,
    val newVersion: Int? = null,
    val conflict: Boolean = false,
    // If there is a conflict, Provide latest metadata
    val latestVersion: Int? = null,
    val lastModifiedBy: String? = null,
    val lastModifiedAt: ZonedDateTime? = null,
)