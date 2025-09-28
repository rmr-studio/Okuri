package okuri.core.repository.block

import okuri.core.entity.block.BlockTypeEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockTypeRepository : JpaRepository<BlockTypeEntity, UUID> {
    fun findByKey(key: String): Optional<BlockTypeEntity>
    fun findByKeyAndOrganisationId(key: String, organisationId: UUID?): Optional<BlockTypeEntity>

    fun findByOrganisationIdOrSystem(organisationId: UUID?, system: Boolean = true): List<BlockTypeEntity>
}