package okuri.core.controller.block

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import okuri.core.models.block.BlockType
import okuri.core.service.block.BlockTypeService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/block/schema")
@Tag(name = "Block Type Management", description = "Endpoints for managing block types and their configurations")
class BlockTypeController(
    private val blockTypeService: BlockTypeService
) {

    /**
     * Creates and publishes a new block type from the provided request.
     *
     * @param request The request payload containing the block type definition and metadata.
     * @return The created `BlockType`.
     */
    @PostMapping("/")
    @Operation(
        summary = "Create a new block type",
        description = "Creates and publishes a new block type based on the provided request data."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Block type created successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun publishBlockType(@Valid @RequestBody request: CreateBlockTypeRequest): ResponseEntity<BlockType> {
        val entity = blockTypeService.publishBlockType(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(entity)
    }

    /**
     * Updates an existing block type identified by the path ID.
     *
     * The provided BlockType must have an `id` equal to the `blockTypeId` path variable; otherwise the request is rejected.
     *
     * @param blockTypeId The UUID of the block type to update.
     * @param blockType The block type data to persist; its `id` must match `blockTypeId`.
     * @return HTTP 200 OK with no body on success; HTTP 400 if `blockType.id` does not match `blockTypeId`.
     */
    @PutMapping("/{blockTypeId}")
    @Operation(
        summary = "Update an existing block type",
        description = "Updates a block type with the specified ID. Does not allow changing the scope of the block type."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Block type updated successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block type not found"),
        ApiResponse(responseCode = "400", description = "Invalid request data")
    )
    fun updateBlockType(
        @PathVariable blockTypeId: UUID,
        @RequestBody blockType: BlockType
    ): ResponseEntity<Void> {
        if (blockType.id != blockTypeId) {
            return ResponseEntity.badRequest().build()
        }
        blockTypeService.updateBlockType(blockType)
        return ResponseEntity.ok().build()
    }

    /**
     * Sets the archive status for the block type identified by [blockTypeId].
     *
     * @param blockTypeId The UUID of the block type to archive or unarchive.
     * @param status `true` to archive the block type, `false` to unarchive it.
     * @return HTTP 204 No Content on success.
     */
    @PutMapping("/{blockTypeId}/archive/{status}")
    @Operation(
        summary = "Archive a block type",
        description = "Archives a block type by its ID. The block type will still be visible to users currently using it but cannot be used in new blocks."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Block type archived successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block type not found")
    )
    fun updateArchiveStatusByBlockTypeId(
        @PathVariable blockTypeId: UUID,
        @PathVariable status: Boolean
    ): ResponseEntity<Unit> {
        blockTypeService.archiveBlockType(blockTypeId, status)
        return ResponseEntity.noContent().build()
    }

    /**
     * Retrieve a block type by its unique key.
     *
     * @param key The unique key identifying the block type.
     * @return The `BlockType` model matching the provided key.
     */
    @GetMapping("/key/{key}")
    @Operation(
        summary = "Get block type by key",
        description = "Retrieves a block type by its unique key."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Block type retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block type not found")
    )
    fun getBlockTypeByKey(@PathVariable key: String): ResponseEntity<BlockType> {
        val blockTypeEntity = blockTypeService.getEntityByKey(key)
        // Note: Assuming toModel() conversion exists on entity - following the established pattern
        val blockType = blockTypeEntity.toModel()
        return ResponseEntity.ok(blockType)
    }

    /**
     * Retrieve all block types for the specified organisation.
     *
     * @param organisationId The UUID of the organisation whose block types should be returned.
     * @return A list of `BlockType` objects belonging to the organisation; an empty list if none exist.
     */
    @GetMapping("/organisation/{organisationId}")
    @Operation(
        summary = "Get block types for organisation",
        description = "Retrieves all block types associated with a specific organisation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Block types retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "No block types found for the organisation")
    )
    fun getBlockTypes(
        @PathVariable organisationId: UUID,
    ): ResponseEntity<List<BlockType>> {
        val blockTypes = blockTypeService.getBlockTypes(organisationId)
        return ResponseEntity.ok(blockTypes)
    }
}