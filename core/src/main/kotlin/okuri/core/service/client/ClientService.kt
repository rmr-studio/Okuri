package okuri.core.service.client

import io.ktor.server.plugins.*
import okuri.core.entity.client.ClientEntity
import okuri.core.entity.company.CompanyEntity
import okuri.core.enums.activity.Activity
import okuri.core.enums.core.EntityType
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

    /**
     * Retrieve all client entities for the specified organisation.
     *
     * @param organisationId UUID of the organisation whose clients should be returned.
     * @return A list of ClientEntity belonging to the organisation; an empty list if none exist.
     * @throws NotFoundException if the organisation cannot be found.
     * @throws IllegalArgumentException if the provided organisationId is invalid.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getOrganisationClients(organisationId: UUID): List<ClientEntity> {
        return findManyResults { repository.findByOrganisationId(organisationId) }
    }

    /**
     * Retrieve a ClientEntity by its ID and enforce post-authorization against the entity's organisation.
     *
     * @return The found ClientEntity.
     * @throws NotFoundException if no client with the given ID exists.
     */
    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getEntityById(id: UUID): ClientEntity {
        return findOrThrow { repository.findById(id) }
    }

    /**
     * Retrieve a client by its ID and enforce organisation access.
     *
     * @param audit If `true`, include audit metadata in the returned client model.
     * @return The client model for the given ID, optionally including audit metadata.
     * @throws NotFoundException if no client exists with the given ID.
     */
    @Throws(NotFoundException::class)
    @PostAuthorize("@organisationSecurity.hasOrg(returnObject.organisationId)")
    fun getClientById(id: UUID, audit: Boolean = false): Client {
        return findOrThrow { repository.findById(id) }.toModel(audit)
    }


    /**
     * Creates a new client for the specified organisation and returns the created client model.
     *
     * If `client.companyId` is provided, the company is resolved and associated with the new client.
     * The creation is recorded via ActivityService (CREATE) using the current authenticated user.
     *
     * @param client Request object containing organisationId, optional companyId, companyRole, name, and contact information.
     * @return The created Client model.
     * @throws NotFoundException if a provided `companyId` does not correspond to an existing company.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun createClient(client: ClientCreationRequest): Client {
        // Fetch associated company if companyId is provided, throw error if not found
        val company: CompanyEntity? = client.companyId?.let {
            companyService.getCompanyById(it).also { companyEntity ->
                require(companyEntity.organisationId == client.organisationId) {
                    "Company must belong to the same organisation as the client"
                }
            }
        }

        ClientEntity(
            organisationId = client.organisationId,
            company = company,
            companyRole = client.companyRole,
            name = client.name,
            contact = client.contact,
        ).run {
            repository.save(this).let { entity ->
                activityService.logActivity(
                    activity = Activity.CLIENT,
                    operation = OperationType.CREATE,
                    userId = authTokenService.getUserId(),
                    organisationId = entity.organisationId,
                    entityType = EntityType.CLIENT,
                    entityId = entity.id,
                    details = mapOf(
                        "clientId" to entity.id.toString()
                    )
                )
                return entity.toModel()
            }
        }
    }

    /**
     * Updates an existing client with the provided values, persists the change, and logs an update activity.
     *
     * Updates the client's name, contact details, and attributes based on the supplied `client` (identified by its id),
     * saves the updated entity, and returns the saved client as a model.
     *
     * @param client The client model containing the id of the client to update and the new field values.
     * @return The updated `Client` model reflecting persisted changes.
     */
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

    /**
     * Delete the given client and record the deletion as an activity.
     *
     * The client's `id` is used to remove the persisted entity; the action is logged
     * as an activity tied to the current user and the client's organisation.
     *
     * @param client The client to delete; its `id` and `organisationId` are used for deletion and audit logging.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun deleteClient(client: Client) {
        repository.deleteById(client.id).run {
            activityService.logActivity(
                activity = Activity.CLIENT,
                operation = OperationType.DELETE,
                userId = authTokenService.getUserId(),
                organisationId = client.organisationId,
                entityType = EntityType.CLIENT,
                entityId = client.id,
                details = mapOf(
                    "clientId" to client.id.toString()
                )
            )
        }
    }

    /**
     * Sets a client's archived state and returns the updated Client model.
     *
     * @param client The client to archive or restore.
     * @param archive `true` to archive the client, `false` to unarchive (restore) it.
     * @return The updated Client model reflecting the new archived state.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#client.organisationId)")
    fun archiveClient(client: Client, archive: Boolean): Client {
        findOrThrow { repository.findById(client.id) }.apply {
            archived = archive
        }.run {
            repository.save(this).run {
                activityService.logActivity(
                    activity = Activity.CLIENT,
                    operation = if (archive) OperationType.ARCHIVE else OperationType.RESTORE,
                    userId = authTokenService.getUserId(),
                    organisationId = this.organisationId,
                    entityType = EntityType.CLIENT,
                    entityId = this.id,
                    details = mapOf(
                        "clientId" to this.id.toString(),
                        "archiveStatus" to archive
                    )
                )
                return this.toModel()
            }
        }
    }
}