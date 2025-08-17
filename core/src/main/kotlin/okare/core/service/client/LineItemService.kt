package okare.core.service.client

import io.ktor.server.plugins.*
import okare.core.entity.invoice.LineItemEntity
import okare.core.entity.invoice.toModel
import okare.core.enums.activity.Activity
import okare.core.enums.util.OperationType
import okare.core.models.client.request.LineItemCreationRequest
import okare.core.models.invoice.LineItem
import okare.core.repository.client.LineItemRepository
import okare.core.service.activity.ActivityService
import okare.core.service.auth.AuthTokenService
import okare.core.util.ServiceUtil.findManyResults
import okare.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.prepost.PostAuthorize
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

@Service
class LineItemService(
    private val repository: LineItemRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {

    @Throws(NotFoundException::class, IllegalArgumentException::class)
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationLineItem(organisationId: UUID): List<LineItemEntity> {
        return findManyResults(organisationId, repository::findByOrganisationId)
    }

    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getLineItemById(id: UUID): LineItemEntity {
        return findOrThrow(id, repository::findById)
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    fun createLineItem(request: LineItemCreationRequest): LineItem {
        LineItemEntity(
            organisationId = request.organisationId,
            name = request.name,
            description = request.description,
            chargeRate = request.chargeRate
        ).run {
            repository.save(this).let { entity ->
                activityService.logActivity(
                    activity = Activity.LINE_ITEM,
                    operation = OperationType.CREATE,
                    userId = authTokenService.getUserId(),
                    organisationId = entity.organisationId,
                    additionalDetails = "Created line item with ID: ${entity.id}"
                )
                return entity.toModel()
            }
        }

    }

    @PreAuthorize("@organisationSecurity.hasOrg(#lineItem.organisationId)")
    fun updateLineItem(lineItem: LineItem): LineItem {

        findOrThrow(lineItem.id, repository::findById).apply {
            name = lineItem.name
            description = lineItem.description
            chargeRate = lineItem.chargeRate
        }.run {
            repository.save(this)
            // Todo: Would need to mark Invoices as outdated if the line item charge changes
            activityService.logActivity(
                activity = Activity.LINE_ITEM,
                operation = OperationType.UPDATE,
                userId = authTokenService.getUserId(),
                organisationId = this.organisationId,
                additionalDetails = "Updated line item with ID: ${this.id}"
            )


            return this.toModel()

        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#lineItem.organisationId)")
    fun deleteLineItem(lineItem: LineItem) {

        repository.deleteById(lineItem.id).run {
            activityService.logActivity(
                activity = Activity.LINE_ITEM,
                operation = OperationType.DELETE,
                userId = authTokenService.getUserId(),
                organisationId = lineItem.organisationId,
                additionalDetails = "Deleted line item with ID: ${lineItem.id}"
            )
        }


    }
}