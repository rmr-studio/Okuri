package okuri.core.repository.block

import okuri.core.entity.block.BlockTypeEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockTypeRepository : JpaRepository<BlockTypeEntity, UUID> {
    fun findByKeyAndOrganisationId(key: String, organisationId: UUID?): BlockTypeEntity?
    fun findAllByOrganisationIdOrSystem(organisationId: UUID, includeSystem: Boolean = true): List<BlockTypeEntity>
}