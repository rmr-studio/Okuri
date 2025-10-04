package okuri.core.controller.client

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import okuri.core.models.client.Client
import okuri.core.models.client.request.ClientCreationRequest
import okuri.core.service.client.ClientService
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

    /**
     * Retrieves the client identified by the provided ID.
     *
     * @param includeMetadata If true, include audit metadata with the returned client.
     * @return The Client corresponding to the given ID.
     */
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
    fun getClientById(
        @PathVariable clientId: UUID,
        @RequestParam includeMetadata: Boolean = false
    ): ResponseEntity<Client> {
        val client: Client = clientService.getClientById(clientId, audit = includeMetadata)
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

    /**
     * Deletes the client identified by the given UUID.
     *
     * Removes the client if the requester is authorized and owns the client.
     *
     * @param clientId UUID of the client to delete.
     * @return Response with HTTP 204 No Content on successful deletion.
     */
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
        clientService.getClientById(clientId).run {
            clientService.deleteClient(this)
            return ResponseEntity.noContent().build()
        }
    }

    /**
     * Updates a client's archived status for the given client ID.
     *
     * @param clientId The ID of the client to update.
     * @param status `true` to mark the client as archived, `false` to mark it as not archived.
     * @return HTTP 204 No Content when the archival status is updated.
     */
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
        clientService.getClientById(clientId).run {
            clientService.archiveClient(this, status)
            return ResponseEntity.noContent().build()
        }
    }
}