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
