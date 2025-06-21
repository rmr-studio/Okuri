package okare.core.service.invoice

import okare.core.repository.user.UserRepository
import org.springframework.stereotype.Service

@Service
class InvoiceService(
    private val invoiceRepository: UserRepository,
)