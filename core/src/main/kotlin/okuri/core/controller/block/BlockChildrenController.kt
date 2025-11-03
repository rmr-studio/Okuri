package okuri.core.controller.block

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import okuri.core.entity.block.BlockChildEntity
import okuri.core.models.block.display.BlockTypeNesting
import okuri.core.models.block.request.AddChildRequest
import okuri.core.models.block.request.AddChildrenBulkRequest
import okuri.core.models.block.request.MoveChildRequest
import okuri.core.models.block.request.ReorderChildrenRequest
import okuri.core.repository.block.BlockRepository
import okuri.core.service.block.BlockChildrenService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

/**
 * Controller for managing parent-child block relationships (owned nesting).
 *
 * These endpoints handle the direct hierarchical ownership of blocks, including:
 * - Adding children to parent containers
 * - Moving and reordering children
 * - Detaching children from parents
 * - Managing bulk child operations
 */
@RestController
@RequestMapping("/api/v1/block/child")
@Tag(
    name = "Block Children Management",
    description = "Endpoints for managing parent-child block relationships and nesting"
)
class BlockChildrenController(
    private val blockChildrenService: BlockChildrenService,
    private val blockRepository: BlockRepository
) {

    /**
     * Add a single child block to a parent.
     *
     * Use this endpoint when:
     * - Dragging an existing block into a container
     * - Attaching a block that was created without a parent
     * - Adding a newly created block to a specific position
     *
     * @param parentId The UUID of the parent block
     * @param request The child attachment details including childId and optional orderIndex
     * @return The created BlockChildEntity representing the parent-child relationship
     */
    @PostMapping("/{parentId}/children")
    @Operation(
        summary = "Add a child block to a parent",
        description = "Creates a parent-child relationship by adding a block to a parent. " +
                "Validates organisation ownership and type nesting rules. " +
                "Rejects cycles and enforces child_id uniqueness (a block can only have one parent)."
    )
    @ApiResponses(
        ApiResponse(responseCode = "201", description = "Child added successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data or validation failure"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Parent or child block not found"),
        ApiResponse(responseCode = "409", description = "Child already belongs to another parent")
    )
    fun addChild(
        @PathVariable parentId: UUID,
        @RequestBody request: AddChildRequest
    ): ResponseEntity<BlockChildEntity> {
        val parent = blockRepository.findById(parentId).orElseThrow {
            NoSuchElementException("Parent block $parentId not found")
        }
        val child = blockRepository.findById(request.childId).orElseThrow {
            NoSuchElementException("Child block ${request.childId} not found")
        }

        val nesting = parent.type.nesting
            ?: throw IllegalArgumentException("Parent block type ${parent.type.key} does not support children")

        val index = request.orderIndex ?: Int.MAX_VALUE
        val result = blockChildrenService.addChild(child, parentId, index, nesting)

        return ResponseEntity.status(HttpStatus.CREATED).body(result)
    }

    /**
     * Add multiple children to a parent at once.
     *
     * Use this endpoint when:
     * - Pasting/inserting multiple blocks at once
     * - Importing a batch of blocks
     * - Performing bulk attachment operations
     *
     * @param parentId The UUID of the parent block
     * @param request The bulk attachment details including list of children with positions
     * @return No content on success
     */
    @PostMapping("/{parentId}/children:bulk")
    @Operation(
        summary = "Add multiple children to a parent",
        description = "Bulk operation to add multiple blocks to a parent. " +
                "The service normalizes order indices to 0..n-1. " +
                "All children must pass the same validation as single child addition."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Children added successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data or validation failure"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Parent or one or more child blocks not found"),
        ApiResponse(responseCode = "409", description = "One or more children already belong to another parent")
    )
    fun addChildrenBulk(
        @PathVariable parentId: UUID,
        @RequestBody request: AddChildrenBulkRequest
    ): ResponseEntity<Unit> {
        val parent = blockRepository.findById(parentId).orElseThrow {
            NoSuchElementException("Parent block $parentId not found")
        }

        val nesting = parent.type.nesting
            ?: throw IllegalArgumentException("Parent block type ${parent.type.key} does not support children")

        // Sort by order index and add children sequentially
        request.children
            .sortedBy { it.orderIndex ?: Int.MAX_VALUE }
            .forEach { childItem ->
                val child = blockRepository.findById(childItem.childId).orElseThrow {
                    NoSuchElementException("Child block ${childItem.childId} not found")
                }
                val index = childItem.orderIndex ?: Int.MAX_VALUE
                blockChildrenService.addChild(child, parentId, index, nesting)
            }

        return ResponseEntity.noContent().build()
    }

    /**
     * Move a child block to a different position within the same parent.
     *
     * Use this endpoint when:
     * - Drag-and-drop reordering within the parent
     *
     * For reparenting to a different parent, use that parent's addChild endpoint.
     *
     * @param parentId The UUID of the parent block
     * @param childId The UUID of the child block to move
     * @param request The target index
     * @return No content on success
     */
    @PatchMapping("/{parentId}/children/{childId}/move")
    @Operation(
        summary = "Move a child block to a different position",
        description = "Moves a child block within the same parent to a new index position. " +
                "Renumbers affected children automatically."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Child moved successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data or validation failure"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Parent or child block not found"),
        ApiResponse(responseCode = "409", description = "Validation error during move")
    )
    fun moveChild(
        @PathVariable parentId: UUID,
        @PathVariable childId: UUID,
        @RequestBody request: MoveChildRequest
    ): ResponseEntity<Unit> {
        blockChildrenService.reorderChildren(parentId, childId, request.toIndex)
        return ResponseEntity.noContent().build()
    }

    /**
     * Reorder all children within a parent.
     *
     * Use this endpoint when:
     * - User finishes drag-and-drop and you have the complete new order
     * - Applying a specific ordering to all children
     *
     * @param parentId The UUID of the parent block
     * @param request The complete ordered list of child IDs
     * @return No content on success
     */
    @PatchMapping("/{parentId}/children/reorder")
    @Operation(
        summary = "Reorder all children within a parent",
        description = "Reorders all children in a parent according to the provided order list. " +
                "Validates set equality (all existing children must be in the order list). " +
                "Normalizes indices to 0..n-1."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Children reordered successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data or set mismatch"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Parent block not found")
    )
    fun reorderChildren(
        @PathVariable parentId: UUID,
        @RequestBody request: ReorderChildrenRequest
    ): ResponseEntity<Unit> {
        // Get existing children
        val existingChildren = blockChildrenService.listChildren(parentId)
        val existingChildIds = existingChildren.map { it.childId }.toSet()
        val requestedChildIds = request.order.toSet()

        // Validate that the sets match
        require(existingChildIds == requestedChildIds) {
            "Order list must contain exactly the same children as currently exist. " +
                    "Missing: ${existingChildIds - requestedChildIds}, " +
                    "Extra: ${requestedChildIds - existingChildIds}"
        }

        // Reorder each child to match the requested order
        request.order.forEachIndexed { index, childId ->
            blockChildrenService.reorderChildren(parentId, childId, index)
        }

        return ResponseEntity.noContent().build()
    }

    /**
     * Get all children of a parent block.
     *
     * Use this endpoint when:
     * - Loading the child blocks for display
     * - Querying the current state of a parent's children
     *
     * @param parentId The UUID of the parent block
     * @return List of child edges in order
     */
    @GetMapping("/{parentId}/children")
    @Operation(
        summary = "Get all children of a parent",
        description = "Returns the ordered list of child block edges for a parent block."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "Children retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Parent block not found")
    )
    fun getChildren(
        @PathVariable parentId: UUID
    ): ResponseEntity<List<BlockChildEntity>> {
        val children = blockChildrenService.listChildren(parentId)
        return ResponseEntity.ok(children)
    }

    /**
     * Remove a child from a parent without deleting the block.
     *
     * Use this endpoint when:
     * - Removing a block from a container without deleting it
     * - Detaching a block that might be moved elsewhere or kept top-level
     *
     * The block itself remains in the system, only the parent-child relationship is removed.
     * Remaining children are automatically renumbered.
     *
     * @param parentId The UUID of the parent block
     * @param childId The UUID of the child block to remove
     * @return No content on success
     */
    @DeleteMapping("/{parentId}/children/{childId}")
    @Operation(
        summary = "Remove a child from a parent",
        description = "Removes the parent-child relationship without deleting the child block. " +
                "The child block remains in the system as a top-level block. " +
                "Automatically renumbers remaining children."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Child removed successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Parent or child block not found")
    )
    fun removeChild(
        @PathVariable parentId: UUID,
        @PathVariable childId: UUID
    ): ResponseEntity<Unit> {
        blockChildrenService.removeChild(parentId, childId)
        return ResponseEntity.noContent().build()
    }

    /**
     * Clear all children from a parent.
     *
     * Use this endpoint when:
     * - Clearing all children at once
     * - Bulk detachment of all children in a container
     *
     * All child blocks remain in the system, only the parent-child relationships are removed.
     *
     * @param parentId The UUID of the parent block
     * @return No content on success
     */
    @DeleteMapping("/{parentId}/children")
    @Operation(
        summary = "Clear all children from a parent",
        description = "Removes all children from the parent. " +
                "Child blocks remain in the system as top-level blocks. " +
                "This is a bulk detachment operation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "All children cleared successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Parent block not found")
    )
    fun clearAllChildren(
        @PathVariable parentId: UUID
    ): ResponseEntity<Unit> {
        val children = blockChildrenService.listChildren(parentId)
        children.forEach { child ->
            blockChildrenService.removeChild(parentId, child.childId)
        }
        return ResponseEntity.noContent().build()
    }
}
