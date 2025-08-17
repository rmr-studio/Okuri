package okare.core.controller.invoice

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import okare.core.entity.invoice.toModel
import okare.core.models.client.Client
import okare.core.models.invoice.Invoice
import okare.core.models.invoice.request.InvoiceCreationRequest
import okare.core.service.invoice.InvoiceService
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/invoices")
@Tag(name = "Invoice Management", description = "Endpoints for managing invoices, billing, and PDF generation")
class InvoiceController(
    private val invoiceService: InvoiceService
) {

    @GetMapping("/")
    @Operation(
        summary = "Get all invoices for them provided organisation",
        description = "Retrieves a list of invoices associated with the provided organisation"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "List of invoices retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun getUserInvoices(organisationId: UUID): ResponseEntity<List<Invoice>> {
        val invoices = invoiceService.getOrganisationInvoices(organisationId).map { it.toModel() }
        return ResponseEntity.ok(invoices)
    }

    @GetMapping("/client")
    @Operation(
        summary = "Get invoices for a specific client",
        description = "Retrieves a list of invoices for the specified client, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "List of invoices retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not have access to the client")
    )
    fun getClientInvoices(@RequestBody client: Client): ResponseEntity<List<Invoice>> {
        val invoices = invoiceService.getInvoicesByClientId(client).map { it.toModel() }
        return ResponseEntity.ok(invoices)
    }

    @GetMapping("/{id}")
    @Operation(
        summary = "Get an invoice by ID",
        description = "Retrieves a specific invoice by its ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the invoice"),
        ApiResponse(responseCode = "404", description = "Invoice not found")
    )
    fun getInvoiceById(@PathVariable id: UUID): ResponseEntity<Invoice> {
        val invoice = invoiceService.getInvoiceById(id).toModel()
        return ResponseEntity.ok(invoice)
    }

    @PostMapping("/")
    @Operation(
        summary = "Create a new invoice",
        description = "Creates a new invoice based on the provided request data."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Invoice created successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun createInvoice(@RequestBody request: InvoiceCreationRequest): ResponseEntity<Invoice> {
        val invoice = invoiceService.createInvoice(request)
        return ResponseEntity.status(201).body(invoice)
    }

    @PutMapping("/{id}")
    @Operation(
        summary = "Update an existing invoice",
        description = "Updates an invoice with the specified ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice updated successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the invoice"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun updateInvoice(@PathVariable id: UUID, @RequestBody invoice: Invoice): ResponseEntity<Invoice> {
        if (invoice.id != id) {
            return ResponseEntity.badRequest().build()
        }
        val updatedInvoice = invoiceService.updateInvoice(invoice)
        return ResponseEntity.ok(updatedInvoice)
    }

    @PostMapping("/{id}/cancel")
    @Operation(
        summary = "Cancel an invoice",
        description = "Cancels an invoice with the specified ID, if the user has access and the invoice is not paid or already cancelled."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Invoice cancelled successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the invoice"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "400", description = "Cannot cancel a paid or already cancelled invoice")
    )
    fun cancelInvoice(@PathVariable id: UUID, @RequestBody invoice: Invoice): ResponseEntity<Invoice> {
        if (invoice.id != id) {
            return ResponseEntity.badRequest().build()
        }
        val cancelledInvoice = invoiceService.cancelInvoice(invoice)
        return ResponseEntity.ok(cancelledInvoice)
    }

    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete an invoice",
        description = "Deletes an invoice with the specified ID, if the user has access and the invoice is not paid or cancelled."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Invoice deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the invoice"),
        ApiResponse(responseCode = "404", description = "Invoice not found"),
        ApiResponse(responseCode = "400", description = "Cannot delete a paid or cancelled invoice")
    )
    fun deleteInvoice(@PathVariable id: UUID, @RequestBody invoice: Invoice): ResponseEntity<Void> {
        if (invoice.id != id) {
            return ResponseEntity.badRequest().build()
        }
        invoiceService.deleteInvoice(invoice)
        return ResponseEntity.noContent().build()
    }

    @GetMapping("/{id}/document")
    @Operation(
        summary = "Generate invoice document",
        description = "Generates a PDF document for the invoice with the specified ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Document generated successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the invoice"),
        ApiResponse(responseCode = "404", description = "Invoice not found")
    )
    fun generateInvoiceDocument(@PathVariable id: UUID): ResponseEntity<ByteArray> {
        val invoice = invoiceService.getInvoiceById(id).toModel() // Fetch invoice to check ownership
        val document = invoiceService.generateDocument(invoice)
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header("Content-Disposition", "attachment; filename=invoice-${invoice.invoiceNumber}.pdf")
            .body(document)
    }
}