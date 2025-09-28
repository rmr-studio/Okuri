package okuri.core.service.company

import io.ktor.server.plugins.*
import okuri.core.entity.company.CompanyEntity
import okuri.core.enums.activity.Activity
import okuri.core.enums.util.OperationType
import okuri.core.models.company.Company
import okuri.core.models.company.request.CompanyCreationRequest
import okuri.core.repository.company.CompanyRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.util.ServiceUtil.findManyResults
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.prepost.PostAuthorize
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

@Service
class CompanyService(
    private val repository: CompanyRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
) {

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getOrganisationCompanies(organisationId: UUID): List<CompanyEntity> {
        return findManyResults { repository.findByOrganisationId(organisationId) }
    }

    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getCompanyById(id: UUID): CompanyEntity {
        return findOrThrow { repository.findById(id) }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    fun createCompany(request: CompanyCreationRequest): Company {
        CompanyEntity(
            organisationId = request.organisationId,
            name = request.name,
            address = request.address,
            phone = request.phone,
            email = request.email,
            website = request.website,
            businessNumber = request.businessNumber,
            logoUrl = request.logoUrl,
        ).run {
            repository.save(this).let { entity ->
                activityService.logActivity(
                    activity = Activity.COMPANY,
                    operation = OperationType.CREATE,
                    userId = authTokenService.getUserId(),
                    organisationId = entity.organisationId,
                    additionalDetails = "Created company with ID: ${entity.id}"
                )
                return entity.toModel()
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#company.organisationId)")
    fun updateCompany(company: Company): Company {
        findOrThrow { repository.findById(company.id) }.apply {
            name = company.name
            address = company.address
            phone = company.phone
            email = company.email
            website = company.website
            businessNumber = company.businessNumber
            logoUrl = company.logoUrl
            // attributes should be handled in service layer if required
        }.run {
            repository.save(this).run {
                activityService.logActivity(
                    activity = Activity.COMPANY,
                    operation = OperationType.UPDATE,
                    userId = authTokenService.getUserId(),
                    organisationId = this.organisationId,
                    additionalDetails = "Updated company with ID: ${this.id}"
                )
                return this.toModel()
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#company.organisationId)")
    fun deleteCompany(company: Company) {
        repository.deleteById(company.id).run {
            activityService.logActivity(
                activity = Activity.COMPANY,
                operation = OperationType.DELETE,
                userId = authTokenService.getUserId(),
                organisationId = company.organisationId,
                additionalDetails = "Deleted company with ID: ${company.id}"
            )
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#company.organisationId)")
    fun archiveCompany(company: Company, archive: Boolean): Company {
        findOrThrow { repository.findById(company.id) }.apply {
            archived = archive
        }.run {
            repository.save(this).run {
                activityService.logActivity(
                    activity = Activity.COMPANY,
                    operation = if (archive) OperationType.ARCHIVE else OperationType.RESTORE,
                    userId = authTokenService.getUserId(),
                    organisationId = this.organisationId,
                    additionalDetails = "${if (archive) "Archived" else "Unarchived"} company with ID: ${this.id}"
                )
                return this.toModel()
            }
        }
    }
}
