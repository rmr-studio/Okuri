package okare.core.repository.invoice

import okare.core.entity.invoice.InvoiceEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.*

interface InvoiceRepository : JpaRepository<InvoiceEntity, UUID> {
    fun findByUserId(userId: UUID): List<InvoiceEntity>
    fun findByClientId(clientId: UUID): List<InvoiceEntity>

    @Query("SELECT max(i.invoiceNumber) FROM InvoiceEntity i WHERE i.user.id = :userId")
    fun findMaxInvoiceNumberByUserId(@Param("userId") userId: UUID): Int?

}