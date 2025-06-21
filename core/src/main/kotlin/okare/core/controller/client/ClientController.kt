package okare.core.controller.client

import io.swagger.v3.oas.annotations.tags.Tag
import okare.core.models.client.Client
import okare.core.models.client.request.ClientCreationRequest
import okare.core.service.client.ClientService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/client")
@Tag(name = "Client Management", description = "Endpoints for managing client profiles and details")
class ClientController(private val clientService: ClientService) {

    @GetMapping("/")
    fun getClientsForUser(): ResponseEntity<List<Client>> {
        val clients = clientService.getUserClients()
        return ResponseEntity.ok(clients)
    }

    @GetMapping("/id/{clientId}")
    fun getClientById(@PathVariable clientId: UUID): ResponseEntity<Client> {
        val client: Client = clientService.getUserById(clientId)
        return ResponseEntity.ok(client)
    }

    @PostMapping("/")
    fun createClient(request: ClientCreationRequest): ResponseEntity<Client> {
        val client: Client = clientService.createClient(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(client)
    }

    @PutMapping("/")
    fun updateClient(client: Client): ResponseEntity<Client> {
        val updatedClient: Client = clientService.updateClient(client)
        return ResponseEntity.ok(updatedClient)
    }

    @DeleteMapping("/")
    fun deleteClientById(client: Client): ResponseEntity<Unit> {
        clientService.deleteClient(client)
        return ResponseEntity.noContent().build()
    }

}