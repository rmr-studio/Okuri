package okuri.core.service.client

import io.ktor.server.plugins.*
import okuri.core.entity.client.ClientEntity
import okuri.core.entity.company.CompanyEntity
import okuri.core.enums.activity.Activity
import okuri.core.enums.util.OperationType
import okuri.core.models.client.Client
import okuri.core.models.client.request.ClientCreationRequest
import okuri.core.repository.client.ClientRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.company.CompanyService
import okuri.core.util.ServiceUtil.findManyResults
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.prepost.PostAuthorize
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*


@Service
class ClientService(
    private val repository: ClientRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
    private val companyService: CompanyService
) {

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getOrganisationClients(organisationId: UUID): List<ClientEntity> {
        return findManyResults(organisationId, repository::findByOrganisationId)
    }

    /**
     * Fetch a client by its ID with post-authorization to ensure the user has access to the client's organisation.
     * Returns client access entity.
     * Only used for internal service layer operations. Should not be exposed directly via controller.
     */
    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getEntityById(id: UUID): ClientEntity {
        return findOrThrow(id, repository::findById)
    }

    /**
     * Fetch a client by its ID with post-authorization to ensure the user has access to the client's organisation.
     * Returns client model, with optional audit metadata.
     * Used by controller layer to return client data to the user.
     */
    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getClientById(id: UUID, audit: Boolean = false): Client {
        return findOrThrow(id, repository::findById).toModel(audit)
    }


    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun createClient(client: ClientCreationRequest): Client {
        // Fetch associated company if companyId is provided, throw error if not found
        val company: CompanyEntity? = client.companyId?.let {
            companyService.getCompanyById(it)
        }

        ClientEntity(
            organisationId = client.organisationId,
            company = company,
            companyRole = client.companyRole,
            name = client.name,
            contact = client.contact,
            attributes = client.attributes
        ).run {
            repository.save(this).let { entity ->
                activityService.logActivity(
                    activity = Activity.CLIENT,
                    operation = OperationType.CREATE,
                    userId = authTokenService.getUserId(),
                    organisationId = entity.organisationId,
                    additionalDetails = "Created client with ID: ${entity.id}"
                )
                return entity.toModel()
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun updateClient(client: Client): Client {
        TODO()
//        findOrThrow(client.id, repository::findById).apply {
//            name = client.name
//            contactDetails = client.contactDetails
//            attributes = client.attributes
//        }.run {
//            repository.save(this).run {
//                activityService.logActivity(
//                    activity = Activity.CLIENT,
//                    operation = OperationType.UPDATE,
//                    userId = authTokenService.getUserId(),
//                    organisationId = this.organisationId,
//                    additionalDetails = "Updated client with ID: ${this.id}"
//                )
//
//                return this.toModel()
//            }
//        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun deleteClient(client: Client) {
        repository.deleteById(client.id).run {
            activityService.logActivity(
                activity = Activity.CLIENT,
                operation = OperationType.DELETE,
                userId = authTokenService.getUserId(),
                organisationId = client.organisationId,
                additionalDetails = "Deleted client with ID: ${client.id}"
            )
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun archiveClient(client: Client, archive: Boolean): Client {
        findOrThrow(client.id, repository::findById).apply {
            archived = archive
        }.run {
            repository.save(this).run {
                activityService.logActivity(
                    activity = Activity.CLIENT,
                    operation = if (archive) OperationType.ARCHIVE else OperationType.RESTORE,
                    userId = authTokenService.getUserId(),
                    organisationId = this.organisationId,
                    additionalDetails = "${if (archive) "Archived" else "Unarchived"} client with ID: ${this.id}"
                )
                return this.toModel()
            }
        }
    }
}