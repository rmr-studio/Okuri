package okare.core.service.invoice


import io.github.oshai.kotlinlogging.KLogger
import okare.core.entity.invoice.InvoiceEntity
import okare.core.enums.invoice.InvoiceStatus
import okare.core.models.client.Client
import okare.core.models.invoice.Invoice
import okare.core.models.invoice.request.InvoiceCreationRequest
import okare.core.repository.invoice.InvoiceRepository
import okare.core.service.auth.AuthTokenService
import okare.core.service.pdf.DocumentGenerationService
import okare.core.util.ServiceUtil.findManyResults
import okare.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

@Service
class InvoiceService(
    private val invoiceRepository: InvoiceRepository,
    private val authTokenService: AuthTokenService,
    private val documentGeneratorService: DocumentGenerationService,
    private val logger: KLogger
) {

    fun getInvoicesByUserSession(): List<Invoice> {
        return authTokenService.getUserId().let {
            findManyResults(it, invoiceRepository::findByUserId).map { entity ->
                Invoice.fromEntity(entity)
            }
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnClient(#client)")
    fun getInvoicesByClientId(client: Client): List<Invoice> {
        return findManyResults(client.id, invoiceRepository::findByClientId).map { entity ->
            Invoice.fromEntity(entity)
        }
    }

    @Throws(AccessDeniedException::class)
    fun getInvoiceById(id: UUID): Invoice {
        return authTokenService.getUserId().let {
            findOrThrow(id, invoiceRepository::findById).let {
                Invoice.fromEntity(it)
            }.let { invoice ->
                if (invoice.user.id != it) {
                    throw AccessDeniedException("User does not own this invoice")
                }

                invoice
            }
        }
    }

    fun createInvoice(request: InvoiceCreationRequest): Invoice {
        return authTokenService.getUserId().let {
            val currentInvoiceNumber = invoiceRepository.findMaxInvoiceNumberByUserId(it) ?: 0
            InvoiceEntity(
                userId = it,
                clientId = request.client.id,
                invoiceNumber = currentInvoiceNumber + 1,
                items = request.items,
                amount = request.amount,
                currency = request.currency,
                status = request.status,
                startDate = request.startDate,
                endDate = request.endDate,
                dueDate = request.dueDate
            ).run {
                invoiceRepository.save(this).let { entity ->
                    logger.info { "Invoice Service => User $it => Created new invoice with ID: ${entity.id}" }
                    Invoice.fromEntity(entity)
                }
            }
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnInvoice(#invoice)")
    fun updateInvoice(invoice: Invoice): Invoice {
        return findOrThrow(invoice.id, invoiceRepository::findById).apply {
            invoiceNumber = invoice.invoiceNumber.toInt() // Assuming invoiceNumber is a String in Invoice
            items = invoice.items
            amount = invoice.amount
            currency = invoice.currency
            status = invoice.status
            startDate = invoice.startDate
            endDate = invoice.endDate
            dueDate = invoice.dueDate
        }.run {
            invoiceRepository.save(this).let {
                logger.info { "Invoice Service => Updated invoice with ID: ${this.id}" }
                Invoice.fromEntity(this)
            }
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnInvoice(#invoice)")
    fun generateDocument(invoice: Invoice): ByteArray {
        documentGeneratorService.generateInvoiceDocument(invoice).run {
            logger.info { "Invoice Service => Generated document for invoice with ID: ${invoice.id}" }
            return this
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnInvoice(#invoice)")
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
                logger.info { "Invoice Service => Cancelled invoice with ID: ${this.id}" }
                Invoice.fromEntity(this)
            }
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnInvoice(#invoice)")
    fun deleteInvoice(invoice: Invoice) {
        findOrThrow(invoice.id, invoiceRepository::findById).run {
            if (this.status == InvoiceStatus.PAID) {
                throw IllegalArgumentException("Cannot delete a paid invoice")
            }

            if (this.status == InvoiceStatus.CANCELLED) {
                throw IllegalArgumentException("Cannot delete a cancelled invoice")
            }

            invoiceRepository.deleteById(invoice.id)
        }

    }


}