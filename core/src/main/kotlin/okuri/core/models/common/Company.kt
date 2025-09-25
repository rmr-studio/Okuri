package okuri.core.models.common

import okuri.core.entity.util.AuditableModel
import org.springframework.cglib.core.Block
import java.time.ZonedDateTime
import java.util.*

data class Company(
    val id: UUID,
    val organisationId: UUID,
    val name: String,
    val address: Address? = null,
    val phone: String? = null,
    val email: String? = null,
    val website: String? = null,
    val businessNumber: String? = null,
    val logoUrl: String? = null,
    var attributes: Map<String, Block>? = null,
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null,
) : AuditableModel()