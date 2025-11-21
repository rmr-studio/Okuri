package okuri.core.controller.block

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import okuri.core.enums.core.EntityType
import okuri.core.models.block.BlockEnvironment
import okuri.core.models.block.request.OverwriteEnvironmentRequest
import okuri.core.models.block.request.SaveEnvironmentRequest
import okuri.core.models.block.response.OverwriteEnvironmentResponse
import okuri.core.models.block.response.SaveEnvironmentResponse
import okuri.core.service.block.BlockEnvironmentService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/block/environment")
@Tag(
    name = "Block Environment Management",
    description = "Endpoints for managing block environments, layouts and all block related operations"
)
class BlockEnvironmentController(
    private val environmentService: BlockEnvironmentService
) {
    @PostMapping("/")
    @Operation(
        summary = "Save Block Environment",
        description = "Saves the block environment including layout and structural operations."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Environment saved successfully"),
        ApiResponse(responseCode = "409", description = "Conflict in versioning when saving environment"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun saveBlockEnvironment(@Valid @RequestBody request: SaveEnvironmentRequest): ResponseEntity<SaveEnvironmentResponse> {
        val response = environmentService.saveBlockEnvironment(request)
        if (response.conflict) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response)
        }

        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @PostMapping("/overwrite")
    @Operation(
        summary = "Overwrite Block Environment",
        description = "Overwrites the entire block environment with the provided data."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Environment overwritten successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun overwriteBlockEnvironment(@Valid @RequestBody request: OverwriteEnvironmentRequest): ResponseEntity<OverwriteEnvironmentResponse> {
        val response = environmentService.overwriteBlockEnvironment(request)
        return ResponseEntity.status(HttpStatus.OK).body(response)
    }

    @GetMapping("/type/{type}/id/{entityId}")
    @Operation(
        summary = "Get Block Environment",
        description = "Retrieves the block environment for the specified entity. Creates a default layout if none exists (lazy initialization)."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Environment retrieved successfully"),
        ApiResponse(responseCode = "404", description = "Entity not found"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "403", description = "Forbidden - insufficient permissions")
    )
    fun getBlockEnvironment(
        @PathVariable type: EntityType,
        @PathVariable entityId: UUID,
    ): ResponseEntity<BlockEnvironment> {
        val environment = environmentService.loadBlockEnvironment(entityId, type)
        return ResponseEntity.ok(environment)
    }
}