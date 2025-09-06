package okuri.core.repository.invoice

import okuri.core.entity.invoice.InvoiceEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import java.util.*

interface InvoiceRepository : JpaRepository<InvoiceEntity, UUID> {
    fun findByOrganisationId(userId: UUID): List<InvoiceEntity>
    fun findByClientId(clientId: UUID): List<InvoiceEntity>

    @Query("SELECT max(i.invoiceNumber) FROM InvoiceEntity i WHERE i.organisation.id = :userId")
    fun findMaxInvoiceNumberByOrganisation(organisationId: UUID): Int?

}