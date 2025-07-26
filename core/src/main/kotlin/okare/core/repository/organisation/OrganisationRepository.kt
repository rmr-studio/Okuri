package okare.core.repository.organisation

import okare.core.entity.organisation.OrganisationEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface OrganisationRepository : JpaRepository<OrganisationEntity, UUID>