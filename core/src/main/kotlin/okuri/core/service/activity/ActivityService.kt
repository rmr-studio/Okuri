package okuri.core.service.activity

import io.github.oshai.kotlinlogging.KLogger
import okuri.core.entity.activity.ActivityLogEntity
import okuri.core.enums.activity.Activity
import okuri.core.enums.core.EntityType
import okuri.core.enums.util.OperationType
import okuri.core.models.activity.ActivityLog
import okuri.core.models.common.json.JsonObject
import okuri.core.repository.activity.ActivityLogRepository
import org.springframework.stereotype.Service
import java.time.ZonedDateTime
import java.util.*

@Service
class ActivityService(
    private val logger: KLogger,
    private val repository: ActivityLogRepository
) {
    fun logActivity(
        activity: Activity,
        operation: OperationType,
        userId: UUID,
        organisationId: UUID,
        entityType: EntityType,
        entityId: UUID? = null,
        timestamp: ZonedDateTime = ZonedDateTime.now(),
        details: JsonObject
    ): ActivityLog {
        // Create database entry
        ActivityLogEntity(
            userId = userId,
            organisationId = organisationId,
            activity = activity,
            operation = operation,
            entityType = entityType,
            entityId = entityId,
            timestamp = timestamp,
            details = details
        ).run {
            repository.save(this)
            // Log the activity with the provided details
            logger.info {
                "Activity logged: $activity by User: $userId"
            }

            return this.toModel()
        }
    }

    fun logActivities(activities: List<ActivityLogEntity>) {
        repository.saveAll(activities)
        logger.info { "${activities.size} activities logged." }
    }

    fun createActivityLog(
        activity: Activity,
        operation: OperationType,
        userId: UUID,
        organisationId: UUID,
        entityType: EntityType,
        entityId: UUID? = null,
        details: JsonObject,
        timestamp: ZonedDateTime = ZonedDateTime.now(),
    ) {
        // Create and save the activity log entry to the database
        repository.save(
            ActivityLogEntity(
                id = UUID.randomUUID(),
                userId = userId,
                organisationId = organisationId,
                activity = activity,
                operation = operation,
                entityType = entityType,
                entityId = entityId,
                timestamp = timestamp,
                details = details
            )
        )

    }

}