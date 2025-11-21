package okuri.core.service.company

import io.ktor.server.plugins.*
import okuri.core.entity.company.CompanyEntity
import okuri.core.enums.activity.Activity
import okuri.core.enums.core.EntityType
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

    /**
     * Retrieve all companies for the specified organisation.
     *
     * @param organisationId The UUID of the organisation whose companies to retrieve.
     * @return A list of CompanyEntity objects belonging to the given organisation.
     * @throws NotFoundException if the organisation or requested resources cannot be found.
     * @throws IllegalArgumentException if the provided organisationId is invalid.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getOrganisationCompanies(organisationId: UUID): List<CompanyEntity> {
        return findManyResults { repository.findByOrganisationId(organisationId) }
    }

    /**
     * Retrieve a company entity by its identifier.
     *
     * @return The company entity with the specified id.
     * @throws NotFoundException if no company with the specified id exists.
     */
    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getCompanyById(id: UUID): CompanyEntity {
        return findOrThrow { repository.findById(id) }
    }

    /**
     * Create a new company for the specified organisation.
     *
     * @param request Details for the company to create; must include `organisationId` of an existing organisation.
     * @return The persisted `Company` model with generated identifiers and saved fields.
     */
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
                    entityType = EntityType.COMPANY,
                    entityId = entity.id,
                    details = mapOf(
                        "companyId" to entity.id.toString()
                    )
                )
                return entity.toModel()
            }
        }
    }

    /**
     * Update an existing company using values from the provided company model.
     *
     * @param company The company model containing the new field values (the method is pre-authorized using company.organisationId).
     * @return The updated Company model as persisted.
     * @throws NotFoundException if no company exists with the given id.
     */
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
                    entityType = EntityType.COMPANY,
                    entityId = this.id,
                    details = mapOf(
                        "companyId" to this.id.toString()
                    )
                )
                return this.toModel()
            }
        }
    }

    /**
     * Deletes the specified company and records a corresponding activity log.
     *
     * Removes the company identified by the provided Company's `id` and logs the delete operation using the company's `organisationId` and the current user's id.
     *
     * @param company The company to delete; its `id` is used to remove the record and its `organisationId` is used in the activity log.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#company.organisationId)")
    fun deleteCompany(company: Company) {
        repository.deleteById(company.id).run {
            activityService.logActivity(
                activity = Activity.COMPANY,
                operation = OperationType.DELETE,
                userId = authTokenService.getUserId(),
                organisationId = company.organisationId,
                entityType = EntityType.COMPANY,
                entityId = company.id,
                details = mapOf(
                    "companyId" to company.id.toString()
                )
            )
        }
    }

    /**
     * Sets the archived flag of the given company to the provided value, persists the change, and logs an activity recording the operation.
     *
     * @param company The company to archive or unarchive.
     * @param archive `true` to archive the company, `false` to unarchive it.
     * @return The updated Company model reflecting the new archived state.
     */
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
                    entityType = EntityType.COMPANY,
                    entityId = this.id,
                    details = mapOf(
                        "companyId" to this.id.toString(),
                        "archiveStatus" to archive
                    )
                )
                return this.toModel()
            }
        }
    }
}