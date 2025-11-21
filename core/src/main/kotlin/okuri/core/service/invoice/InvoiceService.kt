package okuri.core.service.invoice


import okuri.core.entity.invoice.InvoiceEntity
import okuri.core.entity.invoice.toModel
import okuri.core.entity.organisation.OrganisationEntity
import okuri.core.enums.activity.Activity
import okuri.core.enums.core.EntityType
import okuri.core.enums.invoice.InvoiceStatus
import okuri.core.enums.util.OperationType
import okuri.core.models.client.Client
import okuri.core.models.invoice.Invoice
import okuri.core.models.invoice.request.InvoiceCreationRequest
import okuri.core.repository.invoice.InvoiceRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.client.ClientService
import okuri.core.service.organisation.OrganisationService
import okuri.core.util.ServiceUtil.findManyResults
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PostAuthorize
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

@Service
class InvoiceService(
    private val invoiceRepository: InvoiceRepository,
    private val organisationService: OrganisationService,
    private val clientService: ClientService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
) {

    /**
     * Retrieve all invoices belonging to the specified organisation.
     *
     * @param organisationId The UUID of the organisation whose invoices to fetch.
     * @return A list of InvoiceEntity objects associated with the organisation.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationInvoices(organisationId: UUID): List<InvoiceEntity> {
        return findManyResults { invoiceRepository.findByOrganisationId(organisationId) }.map { entity ->
            entity
        }
    }

    /**
     * Retrieves all invoices associated with the given client.
     *
     * @param client The client whose invoices should be retrieved.
     * @return A list of `InvoiceEntity` objects belonging to the specified client.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun getInvoicesByClientId(client: Client): List<InvoiceEntity> {
        return findManyResults { invoiceRepository.findByClientId(client.id) }.map { entity ->
            entity
        }
    }

    /**
     * Fetches the invoice entity for the given ID and enforces organisation-level access.
     *
     * @return The InvoiceEntity matching the provided ID.
     * @throws AccessDeniedException if the current principal is not authorized to access the invoice's organisation.
     */
    @Throws(AccessDeniedException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisation.id)")
    fun getInvoiceById(id: UUID): InvoiceEntity {
        authTokenService.getUserId().let {
            return findOrThrow { invoiceRepository.findById(id) }
        }
    }

    /**
     * Creates and persists a new invoice for the specified organisation and client.
     *
     * @param request Details required to create the invoice (organisationId, clientId, invoiceNumber, items, amounts, dates, status, currency, and any custom fields).
     * @return The persisted Invoice model including its assigned ID and stored fields.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    fun createInvoice(request: InvoiceCreationRequest): Invoice {
        val organisation: OrganisationEntity =
            organisationService.getEntityById(request.organisationId)
        val client = clientService.getEntityById(request.clientId)
        return InvoiceEntity(
            organisation = organisation,
            client = client,
            invoiceNumber = request.invoiceNumber,
            items = request.items,
            amount = request.amount,
            currency = request.currency,
            status = request.status,
            startDate = request.startDate,
            endDate = request.endDate,
            issueDate = request.issueDate,
            dueDate = request.dueDate,
            customFields = request.customFields,
        ).run {
            invoiceRepository.save(this).let { entity ->
                activityService.logActivity(
                    activity = Activity.INVOICE,
                    operation = OperationType.CREATE,
                    userId = authTokenService.getUserId(),
                    organisationId = requireNotNull(organisation.id),
                    entityType = EntityType.INVOICE,
                    entityId = entity.id,
                    details = mapOf(
                        "invoiceId" to entity.id.toString(),
                        "invoiceNumber" to entity.invoiceNumber
                    )
                )
                entity.toModel()
            }
        }

    }

    /**
     * Update an existing invoice's fields and persist the changes.
     *
     * @param invoice The invoice model containing the updated values; its `id` identifies the invoice to update and `organisation.id` must be accessible for authorization.
     * @return The updated invoice model reflecting the persisted changes.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#invoice.organisation.id)")
    fun updateInvoice(invoice: Invoice): Invoice {
        return findOrThrow { invoiceRepository.findById(invoice.id) }.apply {
            invoiceNumber = invoice.invoiceNumber // Assuming invoiceNumber is a String in Invoice
            items = invoice.items
            amount = invoice.amount
            currency = invoice.currency
            customFields = invoice.customFields
            status = invoice.status
            startDate = invoice.dates.startDate
            endDate = invoice.dates.endDate
            issueDate = invoice.dates.issueDate
            dueDate = invoice.dates.endDate
        }.run {
            invoiceRepository.save(this).let {
                activityService.logActivity(
                    activity = Activity.INVOICE,
                    operation = OperationType.UPDATE,
                    userId = authTokenService.getUserId(),
                    organisationId = invoice.organisation.id,
                    entityType = EntityType.INVOICE,
                    entityId = this.id,
                    details = mapOf(
                        "invoiceId" to this.id.toString(),
                        "invoiceNumber" to this.invoiceNumber
                    )
                )
                this.toModel()
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#invoice.organisation.id)")
    fun generateDocument(invoice: Invoice, templateId: UUID? = null): ByteArray {
        TODO()
    }

    /**
     * Cancels the specified invoice and persists the change.
     *
     * @param invoice The invoice to cancel; its `id` and `organisation.id` are used to locate and authorize the operation.
     * @return The updated `Invoice` model with its status set to `CANCELLED`.
     * @throws IllegalArgumentException if the invoice's status is `PAID` or already `CANCELLED`.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#invoice.organisation.id)")
    fun cancelInvoice(invoice: Invoice): Invoice {
        // Logic to cancel the invoice by ID
        return findOrThrow { invoiceRepository.findById(invoice.id) }.apply {
            if (this.status == InvoiceStatus.PAID) {
                throw IllegalArgumentException("Cannot cancel a paid invoice")
            }

            if (this.status == InvoiceStatus.CANCELLED) {
                throw IllegalArgumentException("Invoice is already cancelled")
            }
            this.status = InvoiceStatus.CANCELLED
        }.run {
            invoiceRepository.save(this).let {
                activityService.logActivity(
                    activity = Activity.INVOICE,
                    operation = OperationType.ARCHIVE,
                    userId = authTokenService.getUserId(),
                    organisationId = invoice.organisation.id,
                    entityType = EntityType.INVOICE,
                    entityId = this.id,
                    details = mapOf(
                        "invoiceId" to this.id.toString(),
                        "invoiceNumber" to this.invoiceNumber
                    )
                )
                this.toModel()
            }
        }
    }

    /**
     * Permanently deletes the specified invoice after validating it may be removed and records a delete activity.
     *
     * Deletes are disallowed for invoices with status PAID or CANCELLED.
     *
     * @param invoice The invoice to delete; its organisation is used for access control and activity logging.
     * @throws IllegalArgumentException if the invoice status is PAID or CANCELLED.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#invoice.organisation.id)")
    fun deleteInvoice(invoice: Invoice) {
        findOrThrow { invoiceRepository.findById(invoice.id) }.run {
            if (this.status == InvoiceStatus.PAID) {
                throw IllegalArgumentException("Cannot delete a paid invoice")
            }

            if (this.status == InvoiceStatus.CANCELLED) {
                throw IllegalArgumentException("Cannot delete a cancelled invoice")
            }
            activityService.logActivity(
                activity = Activity.INVOICE,
                operation = OperationType.DELETE,
                userId = authTokenService.getUserId(),
                organisationId = invoice.organisation.id,
                entityType = EntityType.INVOICE,
                entityId = this.id,
                details = mapOf(
                    "invoiceId" to this.id.toString(),
                    "invoiceNumber" to this.invoiceNumber
                )
            )
            invoiceRepository.deleteById(invoice.id)
        }

    }


}