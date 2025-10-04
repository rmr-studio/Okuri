package okuri.core.controller.block

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import okuri.core.models.block.Block
import okuri.core.models.block.request.BlockTree
import okuri.core.models.block.request.CreateBlockRequest
import okuri.core.service.block.BlockService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/block")
@Tag(name = "Block Management", description = "Endpoints for creating, reading, updating and deleting blocks")
class BlockController(
    private val blockService: BlockService
) {

    /**
     * Create a new block from the provided request.
     *
     * @param request The payload containing details required to create the block.
     * @return The created `Block` resource. */
    @PostMapping("/")
    @Operation(
        summary = "Create a new block",
        description = "Creates a new block using the provided request details and validates payload when required."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Block created successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access")
    )
    fun createBlock(@RequestBody request: CreateBlockRequest): ResponseEntity<Block> {
        val block = blockService.createBlock(request)
        return ResponseEntity.status(HttpStatus.CREATED).body(block)
    }

    /**
     * Update the block identified by the given ID with the provided payload.
     *
     * Validates that the payload's `id` matches `blockId`; if they differ the request will be rejected.
     *
     * @param blockId UUID of the block to update.
     * @param block The block payload to apply; its `id` must equal `blockId`.
     * @return The updated Block.
     */
    @PutMapping("/{blockId}")
    @Operation(
        summary = "Update an existing block",
        description = "Updates a block by ID. Validates and merges payload according to the block type's validation settings."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Block updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block not found")
    )
    fun updateBlock(
        @PathVariable blockId: UUID,
        @RequestBody block: Block
    ): ResponseEntity<Block> {
        if (block.id != blockId) return ResponseEntity.badRequest().build()
        val updated = blockService.updateBlock(block)
        return ResponseEntity.ok(updated)
    }

    /**
     * Retrieve a block tree with optional expansion of referenced blocks and a depth limit.
     *
     * @param blockId The UUID of the root block to retrieve.
     * @param expandRefs If `true`, referenced blocks will be expanded into the returned tree.
     * @param maxDepth The maximum depth of child blocks to include when expanding references (default 1).
     * @return The requested BlockTree representing the block and its children according to the expansion and depth settings.
     */
    @GetMapping("/{blockId}")
    @Operation(
        summary = "Get a block tree",
        description = "Retrieves a block with optional expansion of references and a maximum depth for child blocks."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Block tree retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block not found")
    )
    fun getBlock(
        @PathVariable blockId: UUID,
        @RequestParam(required = false, defaultValue = "false") expandRefs: Boolean,
        @RequestParam(required = false, defaultValue = "1") maxDepth: Int
    ): ResponseEntity<BlockTree> {
        val tree = blockService.getBlock(blockId, expandRefs, maxDepth)
        return ResponseEntity.ok(tree)
    }

    /**
     * Update a block's archival status.
     *
     * Requires the full block payload in the request body for authorization and validation. If the
     * path `blockId` does not match `block.id`, the request is rejected.
     *
     * @param blockId The UUID of the block to update.
     * @param status `true` to archive the block, `false` to unarchive it.
     * @param block The full block payload used for authorization and validation.
     * @return ResponseEntity with HTTP 204 No Content on success; returns 400 if the path and body IDs differ.
     */
    @PutMapping("/{blockId}/archive/{status}")
    @Operation(
        summary = "Update archival status of a block",
        description = "Archives or unarchives a block. The request must include the full block payload to ensure authorisation and validation are correctly scoped."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Block archival status updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block not found")
    )
    fun updateArchiveStatusByBlockId(
        @PathVariable blockId: UUID,
        @PathVariable status: Boolean,
        @RequestBody block: Block
    ): ResponseEntity<Unit> {
        if (block.id != blockId) return ResponseEntity.badRequest().build()
        blockService.archiveBlock(block, status)
        return ResponseEntity.noContent().build()
    }

    /**
     * Deletes the block identified by the given path ID.
     *
     * The request must include the full block payload and the payload's `id` must equal `blockId`; otherwise the request is rejected.
     *
     * @param blockId The UUID of the block to delete (from the request path).
     * @param block The full block payload (from the request body) used for authorization and cascading rules; its `id` must match `blockId`.
     * @return No content; indicates the block was deleted successfully.
     */
    @DeleteMapping("/{blockId}")
    @Operation(
        summary = "Delete a block",
        description = "Deletes a block by ID. The request must include the full block payload to ensure authorisation and cascading rules are applied correctly."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Block deleted successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block not found")
    )
    fun deleteBlockById(
        @PathVariable blockId: UUID,
        @RequestBody block: Block
    ): ResponseEntity<Unit> {
        if (block.id != blockId) return ResponseEntity.badRequest().build()
        blockService.deleteBlock(block)
        return ResponseEntity.noContent().build()
    }
}