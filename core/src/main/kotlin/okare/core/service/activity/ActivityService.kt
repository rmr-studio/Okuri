package okare.core.service.activity

import io.github.oshai.kotlinlogging.KLogger
import okare.core.enums.activity.Activity
import okare.core.enums.util.OperationType
import org.springframework.stereotype.Service
import java.util.*

@Service
class ActivityService(
    private val logger: KLogger
) {
    fun logActivity(
        activity: Activity,
        operation: OperationType,
        userId: UUID,
        organisationId: UUID? = null,
        targetId: UUID? = null,
        additionalDetails: String? = null
    ) {
        // Create database entry
        // Log the activity with the provided details
        logger.info {
            "Activity logged: $activity by User: $userId" +
                    (if (organisationId != null) " for Organisation: $organisationId" else "") +
                    (if (additionalDetails != null) " with details: $additionalDetails" else "")
        }
    }

}