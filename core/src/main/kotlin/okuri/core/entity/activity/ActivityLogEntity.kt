package okuri.core.entity.activity

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okuri.core.enums.activity.Activity
import okuri.core.enums.core.EntityType
import okuri.core.enums.util.OperationType
import okuri.core.models.activity.ActivityLog
import okuri.core.models.common.json.JsonObject
import org.hibernate.annotations.Type
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "activity_logs",
    indexes = [
        Index(columnList = "user_id"),
        Index(columnList = "organisation_id"),
    ]
)
data class ActivityLogEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", nullable = false, columnDefinition = "uuid")
    val id: UUID? = null,

    @Enumerated(EnumType.STRING)
    @Column(name = "activity")
    val activity: Activity,

    @Enumerated(EnumType.STRING)
    @Column(name = "operation")
    val operation: OperationType,

    @Column(name = "user_id", nullable = false)
    val userId: UUID,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    val entityType: EntityType,

    @Column(name = "entity_id", columnDefinition = "uuid")
    val entityId: UUID? = null,

    @Type(JsonBinaryType::class)
    @Column(name = "details", columnDefinition = "jsonb", nullable = false)
    val details: JsonObject,

    @Column(name = "timestamp", nullable = false)
    val timestamp: ZonedDateTime = ZonedDateTime.now(),

    ) {
    fun toModel(): ActivityLog {
        val id = requireNotNull(this.id) { "ActivityLogEntity ID cannot be null when converting to model" }
        return ActivityLog(
            id = id,
            activity = this.activity,
            operation = this.operation,
            userId = this.userId,
            organisationId = this.organisationId,
            entityType = this.entityType,
            entityId = this.entityId,
            details = this.details,
            timestamp = this.timestamp,
        )
    }
}