package okuri.core.models.company.request

import okuri.core.models.common.Address
import org.springframework.cglib.core.Block
import java.util.*

data class CompanyCreationRequest(
    val organisationId: UUID,
    val name: String,
    val address: Address? = null,
    val phone: String? = null,
    val email: String? = null,
    val website: String? = null,
    val businessNumber: String? = null,
    val logoUrl: String? = null,
    var attributes: Map<String, Block>? = null,
)