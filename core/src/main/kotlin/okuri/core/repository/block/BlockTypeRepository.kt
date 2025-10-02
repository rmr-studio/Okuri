package okuri.core.repository.block

import okuri.core.entity.block.BlockTypeEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockTypeRepository : JpaRepository<BlockTypeEntity, UUID> {
    fun findByKey(key: String): Optional<BlockTypeEntity>
    fun findByOrganisationIdOrSystem(organisationId: UUID?, system: Boolean = true): List<BlockTypeEntity>
    fun findTopByOrganisationIdAndKeyOrderByVersionDesc(organisationId: UUID, key: String): BlockTypeEntity?
    fun findByOrganisationIdAndKeyAndVersion(organisationId: UUID, key: String, version: Int): Optional<BlockTypeEntity>
    fun findTopBySystemTrueAndKeyOrderByVersionDesc(key: String): BlockTypeEntity?
    fun findBySystemTrueAndKeyAndVersion(key: String, version: Int): Optional<BlockTypeEntity>
}