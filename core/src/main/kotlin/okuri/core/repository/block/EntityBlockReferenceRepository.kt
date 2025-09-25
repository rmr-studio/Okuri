package okuri.core.repository.block

import okuri.core.entity.client.ClientEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface EntityBlockReferenceRepository : JpaRepository<ClientEntity, UUID>