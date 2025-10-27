package okuri.core.controller.block

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import okuri.core.entity.block.BlockChildEntity
import okuri.core.models.block.request.AddChildRequest
import okuri.core.models.block.request.AddChildrenBulkRequest
import okuri.core.models.block.request.MoveChildRequest
import okuri.core.models.block.request.ReorderChildrenRequest
import okuri.core.repository.block.BlockRepository
import okuri.core.service.block.BlockChildrenService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

/**
 * Controller for managing parent-child block relationships (owned nesting).
 *
 * These endpoints handle the direct hierarchical ownership of blocks, including:
 * - Adding children to parent containers
 * - Moving and reordering children within slots
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
     * Add a single child block to a parent's slot.
     *
     * Use this endpoint when:
     * - Dragging an existing block into a container/slot
     * - Attaching a block that was created without a parent
     * - Adding a newly created block to a specific position
     *
     * @param parentId The UUID of the parent block
     * @param request The child attachment details including childId, slot, and optional orderIndex
     * @return The created BlockChildEntity representing the parent-child relationship
     */
    @PostMapping("/{parentId}/children")
    @Operation(
        summary = "Add a child block to a parent",
        description = "Creates a parent-child relationship by adding a block to a parent's slot. " +
                "Validates organisation ownership, slot compatibility, and type nesting rules. " +
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
        // TODO: Implementation requires parent.type.nesting to be retrieved
        // The service method addChild() requires:
        // - child: BlockEntity
        // - parentId: UUID
        // - slot: String
        // - index: Int
        // - nesting: BlockTypeNesting
        //
        // Missing: Need to load parent block and extract nesting configuration
        // from parent.type.nesting before calling service layer
        TODO("Requires BlockService integration to load parent and get nesting configuration")
    }

    /**
     * Add multiple children to a parent's slot at once.
     *
     * Use this endpoint when:
     * - Pasting/inserting multiple blocks into a slot at once
     * - Importing a batch of blocks
     * - Performing bulk attachment operations
     *
     * @param parentId The UUID of the parent block
     * @param request The bulk attachment details including slot and list of children with positions
     * @return No content on success
     */
    @PostMapping("/{parentId}/children:bulk")
    @Operation(
        summary = "Add multiple children to a parent slot",
        description = "Bulk operation to add multiple blocks to a parent's slot. " +
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
        // TODO: Implementation requires:
        // 1. Load parent block and get nesting configuration
        // 2. Iterate through children and call addChild for each
        // 3. Handle partial failures and rollback strategy
        //
        // Alternative: Create a new service method addChildrenBulk() for atomic operation
        TODO("Requires either service method addChildrenBulk() or transaction wrapper for multiple addChild calls")
    }

    /**
     * Move a child block within parent or across slots.
     *
     * Use this endpoint when:
     * - Drag-and-drop reordering within the same slot (change index)
     * - Moving across slots within same parent (slot change + new index)
     * - For reparenting to different parent, use that parent's addChild endpoint
     *
     * @param parentId The UUID of the parent block
     * @param childId The UUID of the child block to move
     * @param request The target slot and index
     * @return No content on success
     */
    @PatchMapping("/{parentId}/children/{childId}/move")
    @Operation(
        summary = "Move a child block to a different position or slot",
        description = "Moves a child block within the same parent. " +
                "Can reorder within same slot or move to a different slot. " +
                "Source slot is inferred from current edge. " +
                "Renumbers both affected slots automatically."
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
        // Service method available: moveChildToSlot(childId, fromSlot, toSlot, toIndex, nesting)
        // TODO: Requires:
        // 1. Determine current slot (fromSlot) by querying edge for this child
        // 2. Load parent and get nesting configuration for validation
        //
        // Can be implemented once fromSlot lookup is added
        TODO("Requires querying current edge to determine fromSlot and loading parent nesting")
    }

    /**
     * Reorder children within a single slot.
     *
     * Use this endpoint when:
     * - User finishes drag-and-drop within one slot and you have the new explicit order
     * - Applying a specific ordering to a slot's children
     *
     * @param parentId The UUID of the parent block
     * @param request The slot name and complete ordered list of child IDs
     * @return No content on success
     */
    @PatchMapping("/{parentId}/children/reorder")
    @Operation(
        summary = "Reorder children within a single slot",
        description = "Reorders all children in a slot according to the provided order list. " +
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
        // Service method available: replaceSlot(parentId, slot, orderedChildIds, nesting)
        // TODO: Requires loading parent and getting nesting configuration for validation
        //
        // Can be implemented once nesting retrieval is added
        TODO("Requires loading parent block and extracting nesting configuration")
    }

    /**
     * Remove a child from a parent without deleting the block.
     *
     * Use this endpoint when:
     * - Removing a block from a container without deleting it
     * - Detaching a block that might be moved elsewhere or kept top-level
     *
     * The block itself remains in the system, only the parent-child relationship is removed.
     * Remaining children in the slot are automatically renumbered.
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
                "Automatically renumbers remaining children in the affected slot."
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
        // Service method available: removeChild(parentId, slot, childId)
        // TODO: Requires determining which slot the child is in
        // Can query blockChildrenRepository.findByParentIdAndChildId(parentId, childId) to get slot
        //
        // Can be implemented with edge query
        TODO("Requires querying edge to determine slot before calling removeChild()")
    }

    /**
     * Clear all children from a specific slot.
     *
     * Use this endpoint when:
     * - Clearing an entire slot at once (e.g., remove all "addresses")
     * - Bulk detachment of all children in a container section
     *
     * All child blocks remain in the system, only the parent-child relationships are removed.
     *
     * @param parentId The UUID of the parent block
     * @param slot The name of the slot to clear
     * @return No content on success
     */
    @DeleteMapping("/{parentId}/children")
    @Operation(
        summary = "Clear all children from a slot",
        description = "Removes all children from the specified slot. " +
                "Child blocks remain in the system as top-level blocks. " +
                "This is a bulk detachment operation."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Slot cleared successfully"),
        ApiResponse(responseCode = "400", description = "Slot parameter is required"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Parent block not found")
    )
    fun clearSlot(
        @PathVariable parentId: UUID,
        @RequestParam slot: String
    ): ResponseEntity<Unit> {
        // TODO: Service method missing
        // Required: BlockChildrenService.detachChildrenBySlot(parentId, slot)
        // or BlockChildrenService.clearSlot(parentId, slot)
        //
        // This functionality was attempted in tests but not implemented in service
        TODO("Requires new service method: detachChildrenBySlot(parentId, slot)")
    }
}
