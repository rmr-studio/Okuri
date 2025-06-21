package okare.core.controller.client

import io.swagger.v3.oas.annotations.tags.Tag
import okare.core.models.client.Client
import okare.core.service.client.ClientService
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/v1/client")
@Tag(name = "Client Management", description = "Endpoints for managing client profiles and details")
class ClientController(private val clientService: ClientService) {

    @GetMapping("/")
    fun getClientsForUser(): List<Client> {
        TODO()
    }

    @GetMapping("/id/{clientId}")
    fun getClientById(clientId: UUID): Client {
        TODO()
    }

    @PostMapping("/")
    fun createClient(client: Client): Client {
        TODO()
    }
    
    @PutMapping("/")
    fun updateClient(client: Client): Client {
        TODO()
    }

    @DeleteMapping("/id/{clientId}")
    fun deleteClientById(clientId: UUID) {
        TODO()
    }

}