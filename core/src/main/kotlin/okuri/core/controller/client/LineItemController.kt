package okuri.core.controller.client

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import okuri.core.entity.invoice.toModel
import okuri.core.models.client.request.LineItemCreationRequest
import okuri.core.models.invoice.LineItem
import okuri.core.service.billable.LineItemService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/item")
@Tag(name = "Line Item Management", description = "Endpoints for managing line item records")
class LineItemController(private val lineItemService: LineItemService) {

    @GetMapping("/organisation/{organisationId}")
    @Operation(
        summary = "Get all line items for an organisation",
        description = "Retrieves a list of line items associated with a given organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "List of line items retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
    )
    fun getLineItemsForOrganisation(@PathVariable organisationId: UUID): ResponseEntity<List<LineItem>> {
        val lineItems = lineItemService.getOrganisationLineItem(organisationId).map { it.toModel() }
        return ResponseEntity.ok(lineItems)
    }

    @GetMapping("/{lineItemId}")
    @Operation(
        summary = "Get a line item by ID",
        description = "Retrieves a specific line item by its ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Line item retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Line item not found")
    )
    fun getLineItemById(@PathVariable lineItemId: UUID): ResponseEntity<LineItem> {
        val lineItem: LineItem = lineItemService.getLineItemById(lineItemId).toModel()
        return ResponseEntity.ok(lineItem)
    }

    @PostMapping("/")
    @Operation(
        summary = "Create a new line item",
        description = "Creates a new line item based on the provided request data."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Line item created successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun createLineItem(@RequestBody request: LineItemCreationRequest): ResponseEntity<LineItem> {
        val lineItem: LineItem = lineItemService.createLineItem(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(lineItem)
    }

    @PutMapping("/{lineItemId}")
    @Operation(
        summary = "Update an existing line item",
        description = "Updates a line item with the specified ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Line item updated successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the line item"),
        ApiResponse(responseCode = "404", description = "Line item not found"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun updateLineItem(@PathVariable lineItemId: UUID, @RequestBody lineItem: LineItem): ResponseEntity<LineItem> {
        if (lineItem.id != lineItemId) {
            return ResponseEntity.badRequest().build()
        }
        val updatedLineItem: LineItem = lineItemService.updateLineItem(lineItem)
        return ResponseEntity.ok(updatedLineItem)
    }

    @DeleteMapping("/{lineItemId}")
    @Operation(
        summary = "Delete a line item by ID",
        description = "Deletes a line item with the specified ID, if the user has access."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Line item deleted successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "User does not own the line item"),
        ApiResponse(responseCode = "404", description = "Line item not found")
    )
    fun deleteLineItemById(@PathVariable lineItemId: UUID): ResponseEntity<Unit> {
        val lineItem = lineItemService.getLineItemById(lineItemId).toModel()
        lineItemService.deleteLineItem(lineItem)
        return ResponseEntity.noContent().build()
    }
}