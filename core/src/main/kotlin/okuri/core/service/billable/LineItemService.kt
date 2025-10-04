package okuri.core.service.billable

import io.ktor.server.plugins.*
import okuri.core.entity.invoice.LineItemEntity
import okuri.core.entity.invoice.toModel
import okuri.core.enums.activity.Activity
import okuri.core.enums.util.OperationType
import okuri.core.models.client.request.LineItemCreationRequest
import okuri.core.models.invoice.LineItem
import okuri.core.repository.billable.LineItemRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.util.ServiceUtil.findManyResults
import okuri.core.util.ServiceUtil.findOrThrow
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

    /**
     * Retrieves all line items for the specified organisation.
     *
     * @param organisationId The UUID of the organisation whose line items should be fetched.
     * @return A list of LineItemEntity that belong to the organisation; an empty list if none exist.
     * @throws NotFoundException If the organisation does not exist or cannot be accessed.
     * @throws IllegalArgumentException If the provided organisationId is invalid.
     */
    @Throws(NotFoundException::class, IllegalArgumentException::class)
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationLineItem(organisationId: UUID): List<LineItemEntity> {
        return findManyResults { repository.findByOrganisationId(organisationId) }
    }

    /**
     * Retrieve a line item entity by its UUID.
     *
     * @param id The UUID of the line item to retrieve.
     * @return The line item entity for the given id.
     * @throws NotFoundException if no line item exists with the given id.
     */
    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getLineItemById(id: UUID): LineItemEntity {
        return findOrThrow { repository.findById(id) }
    }

    /**
     * Create a new line item for the given organisation.
     *
     * Persists a line item using the provided creation request and records a creation activity for auditing.
     *
     * @param request The creation request containing `organisationId`, `name`, `description`, and `chargeRate`.
     * @return The persisted `LineItem` model representing the newly created line item.
     */
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

    /**
     * Update an existing line item and persist the changes.
     *
     * Updates the stored entity identified by the provided lineItem.id with the supplied
     * name, description, and chargeRate, persists the updated entity, and records an update activity.
     *
     * @param lineItem The line item data to apply; its `id` identifies which entity to update.
     * @return The updated `LineItem` model reflecting persisted changes.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#lineItem.organisationId)")
    fun updateLineItem(lineItem: LineItem): LineItem {

        findOrThrow { repository.findById(lineItem.id) }.apply {
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