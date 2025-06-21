package okare.core.service.client

import io.github.oshai.kotlinlogging.KLogger
import io.ktor.server.plugins.*
import okare.core.entity.client.ClientEntity
import okare.core.models.client.Client
import okare.core.models.client.request.ClientCreationRequest
import okare.core.models.user.User
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
    fun getUserClients(): List<Client> {
        return authTokenService.getUserId().let {
            findManyResults(it, repository::findByUserId).map { entity ->
                Client.fromEntity(entity)
            }
        }
    }

    @Throws(NotFoundException::class)
    fun getUserById(id: UUID): Client {
        return findOrThrow(id, repository::findById).let {
            Client.fromEntity(it)
        }
    }


    fun createClient(client: ClientCreationRequest): Client {
        authTokenService.getUserId().let {
            ClientEntity(
                userId = it,
                name = client.name,
                address = client.address,
                phone = client.phone,
                NDISnumber = client.NDISnumber
            ).run {
                repository.save(this).let { entity ->
                    logger.info { "Client Service => User $it => Created new client with ID: ${entity.id}" }
                    return Client.fromEntity(entity)
                }
            }
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnClient(#client)")
    fun updateClient(client: Client) {
        findOrThrow(client.id, repository::findById).apply {
            name = client.name
            address = client.address
            phone = client.phone
            NDISnumber = client.NDISnumber
        }.run {
            repository.save(this)
            logger.info { "Updated user profile with ID: ${this.id}" }
            return User.fromEntity(this)
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnClient(#client)")
    fun deleteClient(client: Client) {
        repository.deleteById(client.id)
        logger.info { "Deleted client with ID: ${client.id}" }
    }

}