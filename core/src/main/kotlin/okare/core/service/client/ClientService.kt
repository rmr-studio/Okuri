package okare.core.service.client

import io.github.oshai.kotlinlogging.KLogger
import io.ktor.server.plugins.*
import okare.core.entity.client.ClientEntity
import okare.core.entity.client.toModel
import okare.core.models.client.Client
import okare.core.models.client.request.ClientCreationRequest
import okare.core.repository.client.ClientRepository
import okare.core.service.auth.AuthTokenService
import okare.core.util.ServiceUtil.findManyResults
import okare.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*


@Service
class ClientService(
    private val repository: ClientRepository,
    private val authTokenService: AuthTokenService,
    private val logger: KLogger
) {

    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getUserClients(): List<ClientEntity> {
        return findManyResults(authTokenService.getUserId(), repository::findByUserId)
    }

    @Throws(NotFoundException::class)
    fun getClientById(id: UUID): ClientEntity {
        return findOrThrow(id, repository::findById)
    }


    fun createClient(client: ClientCreationRequest): Client {
        authTokenService.getUserId().let {
            ClientEntity(
                userId = it,
                name = client.name,
                address = client.address,
                phone = client.phone,
                ndisNumber = client.ndisNumber
            ).run {
                repository.save(this).let { entity ->
                    logger.info { "Client Service => User $it => Created new client with ID: ${entity.id}" }
                    return entity.toModel()
                }
            }
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnClient(#client)")
    fun updateClient(client: Client): Client {
        findOrThrow(client.id, repository::findById).apply {
            name = client.name
            address = client.address
            phone = client.phone
            ndisNumber = client.ndisNumber
        }.run {
            repository.save(this)
            logger.info { "Client Service => Updated client profile with ID: ${this.id}" }
            return this.toModel()
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnClient(#client)")
    fun deleteClient(client: Client) {
        repository.deleteById(client.id)
        logger.info { "Client Service => Deleted client with ID: ${client.id}" }
    }

}