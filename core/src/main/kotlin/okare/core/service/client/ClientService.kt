package okare.core.service.client

import io.ktor.server.plugins.*
import okare.core.entity.client.ClientEntity
import okare.core.entity.client.toModel
import okare.core.enums.activity.Activity
import okare.core.enums.util.OperationType
import okare.core.models.client.Client
import okare.core.models.client.request.ClientCreationRequest
import okare.core.repository.client.ClientRepository
import okare.core.service.activity.ActivityService
import okare.core.service.auth.AuthTokenService
import okare.core.util.ServiceUtil.findManyResults
import okare.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.prepost.PostAuthorize
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*


@Service
class ClientService(
    private val repository: ClientRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
) {

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getOrganisationClients(organisationId: UUID): List<ClientEntity> {
        return findManyResults(organisationId, repository::findByOrganisationId)
    }

    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getClientById(id: UUID): ClientEntity {
        return findOrThrow(id, repository::findById)
    }


    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun createClient(client: ClientCreationRequest): Client {
        ClientEntity(
            organisationId = client.organisationId,
            name = client.name,
            contactDetails = client.contact,
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
        findOrThrow(client.id, repository::findById).apply {
            name = client.name
            contactDetails = client.contactDetails
            attributes = client.attributes
        }.run {
            repository.save(this).run {
                activityService.logActivity(
                    activity = Activity.CLIENT,
                    operation = OperationType.UPDATE,
                    userId = authTokenService.getUserId(),
                    organisationId = this.organisationId,
                    additionalDetails = "Updated client with ID: ${this.id}"
                )

                return this.toModel()
            }
        }
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