package okare.core.controller.invoice

import io.swagger.v3.oas.annotations.tags.Tag
import okare.core.service.invoice.InvoiceService
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/invoices")
@Tag(name = "Invoice Management", description = "Endpoints for managing invoices, billing and pdf generation")
class InvoiceController(
    private val invoiceService: InvoiceService
)