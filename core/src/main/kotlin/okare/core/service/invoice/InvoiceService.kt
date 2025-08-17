package okare.core.service.invoice


import io.github.oshai.kotlinlogging.KLogger
import okare.core.configuration.auth.OpenApiConfig
import okare.core.entity.invoice.InvoiceEntity
import okare.core.entity.invoice.toModel
import okare.core.entity.organisation.OrganisationEntity
import okare.core.enums.activity.Activity
import okare.core.enums.invoice.InvoiceStatus
import okare.core.enums.util.OperationType
import okare.core.models.client.Client
import okare.core.models.invoice.Invoice
import okare.core.models.invoice.request.InvoiceCreationRequest
import okare.core.models.template.toEntity
import okare.core.repository.invoice.InvoiceRepository
import okare.core.service.activity.ActivityService
import okare.core.service.auth.AuthTokenService
import okare.core.service.client.ClientService
import okare.core.service.organisation.OrganisationService
import okare.core.util.ServiceUtil.findManyResults
import okare.core.util.ServiceUtil.findOrThrow
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
    private val logger: KLogger,
    private val openApiConfig: OpenApiConfig
) {

    fun getInvoicesByUserSession(): List<InvoiceEntity> {
        return authTokenService.getUserId().let {
            findManyResults(it, invoiceRepository::findByUserId).map { entity ->
                entity
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun getInvoicesByClientId(client: Client): List<InvoiceEntity> {
        return findManyResults(client.id, invoiceRepository::findByClientId).map { entity ->
            entity
        }
    }

    @Throws(AccessDeniedException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisation.id)")
    fun getInvoiceById(id: UUID): InvoiceEntity {
        authTokenService.getUserId().let {
            return findOrThrow(id, invoiceRepository::findById)
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    fun createInvoice(request: InvoiceCreationRequest): Invoice {
        return authTokenService.getUserId().let { userId ->
            val organisation: OrganisationEntity =
                organisationService.getOrganisationEntity(request.organisationId)
            val client = clientService.getClientById(request.clientId)
            InvoiceEntity(
                organisation = organisation,
                client = client,
                invoiceNumber = request.invoiceNumber,
                invoiceTemplate = request.template.toEntity(),
                reportTemplate = request.reportTemplate?.toEntity(),
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
                        userId = userId,
                        organisationId = organisation.id,
                        additionalDetails = "Created invoice with number: ${entity.invoiceNumber}, ID: ${entity.id}",
                    )
                    entity.toModel()
                }
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#invoice.organisation.id)")
    fun updateInvoice(invoice: Invoice): Invoice {
        return findOrThrow(invoice.id, invoiceRepository::findById).apply {
            invoiceNumber = invoice.invoiceNumber // Assuming invoiceNumber is a String in Invoice
            items = invoice.items
            amount = invoice.amount
            currency = invoice.currency
            reportTemplate = invoice.reportTemplate?.toEntity()
            customFields = invoice.customFields
            status = invoice.status
            startDate = invoice.dates.startDate
            endDate = invoice.dates.endDate
            issueDate = invoice.dates.issueDate
            dueDate = invoice.dates.endDate
        }.run {
            invoiceRepository.save(this).let {
                // TODO log activity
                this.toModel()
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#invoice.organisation.id)")
    fun generateDocument(invoice: Invoice, templateId: UUID? = null): ByteArray {
        TODO()
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#invoice.organisation.id)")
    fun cancelInvoice(invoice: Invoice): Invoice {
        // Logic to cancel the invoice by ID
        return findOrThrow(invoice.id, invoiceRepository::findById).apply {
            if (this.status == InvoiceStatus.PAID) {
                throw IllegalArgumentException("Cannot cancel a paid invoice")
            }

            if (this.status == InvoiceStatus.CANCELLED) {
                throw IllegalArgumentException("Invoice is already cancelled")
            }
            this.status = InvoiceStatus.CANCELLED
        }.run {
            invoiceRepository.save(this).let {
                // TODO log activity
                this.toModel()
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#invoice.organisation.id)")
    fun deleteInvoice(invoice: Invoice) {
        findOrThrow(invoice.id, invoiceRepository::findById).run {
            if (this.status == InvoiceStatus.PAID) {
                throw IllegalArgumentException("Cannot delete a paid invoice")
            }

            if (this.status == InvoiceStatus.CANCELLED) {
                throw IllegalArgumentException("Cannot delete a cancelled invoice")
            }
            // TODO log activity
            invoiceRepository.deleteById(invoice.id)
        }

    }


}