package okare.core.service.pdf

import com.lowagie.text.*
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import okare.core.models.invoice.Invoice
import okare.core.models.user.Address
import org.springframework.stereotype.Service
import java.awt.Color
import java.io.ByteArrayOutputStream
import java.text.NumberFormat
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter
import java.util.*

@Service
class DocumentGenerationService {

    fun generateInvoiceDocument(invoice: Invoice): ByteArray {
        val outputStream = ByteArrayOutputStream()
        val document = Document(PageSize.A4, 36f, 36f, 54f, 36f)
        PdfWriter.getInstance(document, outputStream)
        document.open()

        val boldFont = Font(Font.HELVETICA, 12f, Font.BOLD)
        val regularFont = Font(Font.HELVETICA, 10f)

        // Header
        document.add(Paragraph("INVOICE", Font(Font.HELVETICA, 16f, Font.BOLD)))
        document.add(Chunk.NEWLINE)

        val infoTable = PdfPTable(2)
        infoTable.widthPercentage = 100f
        infoTable.addCell(getCell("Company: ${invoice.user.company}", PdfPCell.ALIGN_LEFT))
        infoTable.addCell(getCell("Invoice no: ${invoice.invoiceNumber}", PdfPCell.ALIGN_RIGHT))
        infoTable.addCell(getCell("ABN: ${invoice.user.company?.abn}", PdfPCell.ALIGN_LEFT))
        infoTable.addCell(
            getCell(
                "Invoice date: ${formatDate(invoice.startDate)} – ${formatDate(invoice.endDate)}",
                PdfPCell.ALIGN_RIGHT
            )
        )
        infoTable.addCell(getCell("Address: ${invoice.user}", PdfPCell.ALIGN_LEFT))
        infoTable.addCell(getCell("Due date: ${formatDate(invoice.dueDate)}", PdfPCell.ALIGN_RIGHT))
        infoTable.addCell(getCell("Email: ${invoice.user.email}", PdfPCell.ALIGN_LEFT))
        infoTable.addCell(getCell("", PdfPCell.ALIGN_RIGHT))
        infoTable.addCell(getCell("Phone: ${invoice.user.phone}", PdfPCell.ALIGN_LEFT))
        infoTable.addCell(getCell("", PdfPCell.ALIGN_RIGHT))
        document.add(infoTable)

        document.add(Chunk.NEWLINE)

        // Recipient
        document.add(Paragraph("TO: ${invoice.client.name}", boldFont))
        //TODO: GENERATE ADDRESS BLOCK
//        document.add(Paragraph(invoice.client.address, regularFont))
        document.add(Paragraph(invoice.client.phone, regularFont))
        document.add(Paragraph("NDIS number: ${invoice.client.NDISnumber}", regularFont))
        document.add(Chunk.NEWLINE)

        // Billable items table
        val table = PdfPTable(6)
        table.widthPercentage = 100f
        table.setWidths(intArrayOf(15, 25, 20, 10, 10, 10))

        val headers = listOf("SERVICE DATE", "DESCRIPTION", "NDIS LINE ITEM", "QUANTITY", "RATE", "AMOUNT")
        headers.forEach { table.addCell(getHeaderCell(it)) }

        var total = 0.0

//        invoice.items.forEach { item ->
//            val rate = item.lineItem.rate(invoice.startDate)
//            val amount = item.hours.toDouble() * rate
//            total += amount
//
//            table.addCell(getCell(formatDate(item.date)))
//            table.addCell(getCell(item.description))
//            table.addCell(getCell(item.lineItem.code))
//            table.addCell(getCell(item.hours.toString()))
//            table.addCell(getCell(formatCurrency(rate)))
//            table.addCell(getCell(formatCurrency(amount)))
//        }

        document.add(table)
        document.add(Chunk.NEWLINE)

        // Totals
        val totalTable = PdfPTable(2)
        totalTable.widthPercentage = 30f
        totalTable.horizontalAlignment = Element.ALIGN_RIGHT
        totalTable.addCell(getCell("Subtotal:", PdfPCell.ALIGN_LEFT))
        totalTable.addCell(getCell(formatCurrency(total), PdfPCell.ALIGN_RIGHT))
        totalTable.addCell(getCell("Total:", PdfPCell.ALIGN_LEFT))
        totalTable.addCell(getCell(formatCurrency(total), PdfPCell.ALIGN_RIGHT))
        document.add(totalTable)

        document.add(Chunk.NEWLINE)

        // Payment details
        document.add(Paragraph("Payment details", boldFont))
        document.add(Paragraph("Account name: Work Pay", regularFont))
        document.add(Paragraph("BSB: 193-879", regularFont))
        document.add(Paragraph("Account number: 488 029 557", regularFont))

        document.close()
        return outputStream.toByteArray()
    }

    private fun getCell(text: String, alignment: Int = Element.ALIGN_LEFT): PdfPCell {
        val cell = PdfPCell(Phrase(text, Font(Font.HELVETICA, 10f)))
        cell.border = PdfPCell.NO_BORDER
        cell.horizontalAlignment = alignment
        return cell
    }

    private fun getHeaderCell(text: String): PdfPCell {
        val cell = PdfPCell(Phrase(text, Font(Font.HELVETICA, 10f, Font.BOLD)))
        cell.backgroundColor = Color.LIGHT_GRAY
        cell.horizontalAlignment = Element.ALIGN_CENTER
        return cell
    }

    private fun formatCurrency(amount: Double): String {
        return NumberFormat.getCurrencyInstance(Locale("en", "AU")).format(amount)
    }

    private fun formatDate(date: ZonedDateTime): String {
        return date.format(DateTimeFormatter.ofPattern("d/M/yy"))
    }

    private fun generateAddressBlock(address: Address) {}

    private fun generateBillingBlock(address: Address) {}
}
