package okare.core.models.invoice

import java.util.*

data class Recipient(
    val id: UUID,
    val name: String,
    val address: String,
    val phone: String
)