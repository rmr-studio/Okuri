package okuri.core.controller.block

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import okuri.core.models.block.request.SaveEnvironmentRequest
import okuri.core.models.block.response.SaveEnvironmentResponse
import okuri.core.service.block.BlockEnvironmentService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

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
}