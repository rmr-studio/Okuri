package okuri.core.models.common

import org.springframework.cglib.core.Block

data class Company(
    val name: String,
    val address: Address? = null,
    val phone: String? = null,
    val email: String? = null,
    val website: String? = null,
    val businessNumber: String? = null,
    val logoUrl: String? = null,
    var attributes: Map<String, Block>? = null
)