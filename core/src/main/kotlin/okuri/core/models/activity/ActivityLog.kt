package okuri.core.models.activity

import okuri.core.enums.activity.Activity
import okuri.core.enums.core.EntityType
import okuri.core.enums.util.OperationType
import okuri.core.models.common.json.JsonObject
import java.time.ZonedDateTime
import java.util.*

data class ActivityLog(
    val id: UUID,
    val userId: UUID,
    val organisationId: UUID,
    val activity: Activity,
    val operation: OperationType,
    val entityType: EntityType,
    val entityId: UUID? = null,
    val timestamp: ZonedDateTime,
    val details: JsonObject,
)