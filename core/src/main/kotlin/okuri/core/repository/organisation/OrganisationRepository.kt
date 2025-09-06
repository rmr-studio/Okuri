package okuri.core.repository.organisation

import okuri.core.entity.organisation.OrganisationEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface OrganisationRepository : JpaRepository<OrganisationEntity, UUID>