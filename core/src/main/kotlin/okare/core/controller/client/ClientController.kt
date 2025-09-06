package okare.core.controller.client

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import okare.core.entity.client.toModel
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

    @GetMapping("/organisation/{organisationId}")
    @Operation(
        summary = "Get all clients for the organisation",
        description = "Retrieves a list of clients for a given organisation. Given the user is authenticated, and belongs to that specified organisation"
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "List of clients retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "No clients found for the organisation")
    )
    fun getOrganisationClients(@PathVariable organisationId: UUID): ResponseEntity<List<Client>> {
        val clients = clientService.getOrganisationClients(organisationId).map { it.toModel() }
        return ResponseEntity.ok(clients)
    }

    @GetMapping("/{clientId}")
    @Operation(
        summary = "Get a client by ID",
        description = "Retrieves a specific client by its ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Client retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Client not found")
    )
    fun getClientById(@PathVariable clientId: UUID): ResponseEntity<Client> {
        val client: Client = clientService.getClientById(clientId).toModel()
        return ResponseEntity.ok(client)
    }

    @PostMapping("/")
    @Operation(
        summary = "Create a new client",
        description = "Creates a new client based on the provided request data."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Client created successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun createClient(@RequestBody request: ClientCreationRequest): ResponseEntity<Client> {
        val client: Client = clientService.createClient(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(client)
    }

    @PutMapping("/{clientId}")
    @Operation(
        summary = "Update an existing client",
        description = "Updates a client with the specified ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Client updated successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the client"),
        ApiResponse(responseCode = "404", description = "Client not found"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun updateClient(@PathVariable clientId: UUID, @RequestBody client: Client): ResponseEntity<Client> {
        if (client.id != clientId) {
            return ResponseEntity.badRequest().build()
        }
        val updatedClient: Client = clientService.updateClient(client)
        return ResponseEntity.ok(updatedClient)
    }

    @DeleteMapping("/{clientId}")
    @Operation(
        summary = "Delete a client by ID",
        description = "Deletes a client with the specified ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Client deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the client"),
        ApiResponse(responseCode = "404", description = "Client not found")
    )
    fun deleteClientById(@PathVariable clientId: UUID): ResponseEntity<Unit> {
        // Check ownership of client
        val client = clientService.getClientById(clientId).toModel()
        clientService.deleteClient(client)
        return ResponseEntity.noContent().build()
    }

    @PutMapping("/{clientId}/archive/{status}")
    @Operation(
        summary = "Updates the archival status of a client",
        description = "Archives or unarchives a client based on the provided status, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Client archival status updated successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the client"),
        ApiResponse(responseCode = "404", description = "Client not found")
    )
    fun updateArchiveStatusByClientId(
        @PathVariable clientId: UUID,
        @PathVariable status: Boolean
    ): ResponseEntity<Unit> {
        // Check ownership of client
        val client = clientService.getClientById(clientId).toModel()
        clientService.archiveClient(client, status)
        return ResponseEntity.noContent().build()
    }
}