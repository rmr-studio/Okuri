package okuri.core.controller.block

import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.responses.ApiResponse
import io.swagger.v3.oas.annotations.responses.ApiResponses
import io.swagger.v3.oas.annotations.tags.Tag
import okuri.core.enums.block.BlockReferenceFetchPolicy
import okuri.core.enums.core.EntityType
import okuri.core.models.block.request.UpsertBlockReferenceRequest
import okuri.core.models.block.request.UpsertEntityReferencesRequest
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.block.BlockReferenceService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

/**
 * Controller for managing block references (linked references).
 *
 * These endpoints handle external entity references and block-to-block links:
 * - Entity reference lists (clients, projects, etc.)
 * - Single block references
 * - Reference resolution with LAZY/EAGER fetch policies
 */
@RestController
@RequestMapping("/api/v1/block/reference")
@Tag(name = "Block References Management", description = "Endpoints for managing linked entity and block references")
class BlockReferencesController(
    private val blockReferenceService: BlockReferenceService,
    private val blockRepository: BlockRepository,
    private val blockReferenceRepository: BlockReferenceRepository
) {

    /**
     * Update the entity reference list for a reference block.
     *
     * Use this endpoint when:
     * - Adding/removing/reordering entities in a reference list
     * - Updating which clients, projects, or other entities are linked
     * - Any change to EntityReferenceMetadata.items
     *
     * Performs delta upsert: adds new references, updates existing ones, and removes missing ones.
     *
     * @param id The UUID of the reference block
     * @param request The list of entity references and optional path prefix
     * @return No content on success
     */
    @PutMapping("/{id}/refs:links")
    @Operation(
        summary = "Update entity reference list",
        description = "Performs delta-upsert on a reference block's entity list. " +
                "Adds new references, updates positions, and removes entries not in the new list. " +
                "Honors allowDuplicates policy. Rejects type=BLOCK (use refs:block endpoint for block references)."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "References updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data or BLOCK type in entity list"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block not found"),
        ApiResponse(responseCode = "409", description = "Duplicate references when allowDuplicates=false")
    )
    fun upsertEntityReferences(
        @PathVariable id: UUID,
        @RequestBody request: UpsertEntityReferencesRequest
    ): ResponseEntity<Unit> {
        // TODO: Implementation requires:
        // 1. Load the block entity from repository
        // 2. Verify block has EntityReferenceMetadata payload
        // 3. Construct EntityReferenceMetadata from request
        // 4. Call blockReferenceService.upsertLinksFor(block, metadata)
        //
        // Service method available: upsertLinksFor(block: BlockEntity, meta: EntityReferenceMetadata)
        //
        // Missing: Need to construct full EntityReferenceMetadata including:
        // - items (from request)
        // - path (from request.pathPrefix or default "$.items")
        // - allowDuplicates (need to get from block's existing metadata or use default)
        // - fetchPolicy (need to preserve from existing metadata)
        // - meta (BlockMeta)
        TODO("Requires loading block entity and constructing EntityReferenceMetadata with all properties")
    }

    /**
     * Update the single block reference for a reference block.
     *
     * Use this endpoint when:
     * - Changing which block is referenced (reference a different block tree)
     * - Setting up a block-to-block reference
     *
     * Ensures there's exactly one row for the block's single reference.
     *
     * @param id The UUID of the reference block
     * @param request The block reference item and optional path
     * @return No content on success
     */
    @PutMapping("/{id}/refs:block")
    @Operation(
        summary = "Update single block reference",
        description = "Updates which block is referenced by a BlockReferenceMetadata block. " +
                "Ensures exactly one reference row exists. " +
                "The referenced item must have type=BLOCK."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Block reference updated successfully"),
        ApiResponse(responseCode = "400", description = "Invalid request data or non-BLOCK type"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block not found")
    )
    fun upsertBlockReference(
        @PathVariable id: UUID,
        @RequestBody request: UpsertBlockReferenceRequest
    ): ResponseEntity<Unit> {
        // TODO: Implementation requires:
        // 1. Load the block entity from repository
        // 2. Verify block has BlockReferenceMetadata payload
        // 3. Verify request.item.type == EntityType.BLOCK
        // 4. Construct BlockReferenceMetadata from request
        // 5. Call blockReferenceService.upsertBlockLinkFor(block, metadata)
        //
        // Service method available: upsertBlockLinkFor(block: BlockEntity, meta: BlockReferenceMetadata)
        //
        // Missing: Need to construct full BlockReferenceMetadata including:
        // - item (from request)
        // - path (from request.path or default "$.block")
        // - fetchPolicy (need to preserve from existing metadata)
        // - meta (BlockMeta)
        TODO("Requires loading block entity and constructing BlockReferenceMetadata with all properties")
    }

    /**
     * Retrieve resolved references for a reference block.
     *
     * Use this endpoint when:
     * - Rendering a reference block and need its resolved targets
     * - Fetching entity details or block tree for display
     *
     * Supports both LAZY and EAGER fetch policies:
     * - LAZY: Returns IDs with warning=REQUIRES_LOADING
     * - EAGER: Uses resolvers to attach entity data or BlockTree
     *
     * @param id The UUID of the reference block
     * @param policy Optional fetch policy override (LAZY or EAGER)
     * @return List of resolved references with entity data or warnings
     */
    @GetMapping("/{id}/refs")
    @Operation(
        summary = "Get resolved references for a block",
        description = "Retrieves and optionally resolves references for a reference block. " +
                "Returns different response types based on the block's metadata type: " +
                "EntityReferenceMetadata returns a list, BlockReferenceMetadata returns a single reference. " +
                "LAZY mode returns IDs only, EAGER mode resolves entities via configured resolvers."
    )
    @ApiResponses(
        ApiResponse(responseCode = "200", description = "References retrieved successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block not found")
    )
    fun getReferences(
        @PathVariable id: UUID,
        @RequestParam(required = false) policy: BlockReferenceFetchPolicy?
    ): ResponseEntity<*> {
        // TODO: Implementation requires:
        // 1. Load the block entity from repository
        // 2. Check block.payload type (EntityReferenceMetadata or BlockReferenceMetadata)
        // 3. If policy override provided, modify metadata's fetchPolicy
        // 4. Call appropriate service method:
        //    - EntityReferenceMetadata: blockReferenceService.findListReferences(id, metadata)
        //    - BlockReferenceMetadata: blockReferenceService.findBlockLink(id, metadata)
        // 5. Return appropriate response type (List<Reference<*>> or Reference<Block>)
        //
        // Service methods available:
        // - findListReferences(blockId, meta: EntityReferenceMetadata): List<Reference<*>>
        // - findBlockLink(blockId, meta: BlockReferenceMetadata): Reference<Block>
        //
        // Missing: Need to handle different return types based on metadata type
        TODO("Requires loading block, determining metadata type, and calling appropriate service method")
    }

    /**
     * Clear all references from a reference block.
     *
     * Use this endpoint when:
     * - Converting a reference block back to pure content
     * - Resetting all references at once
     *
     * Removes all reference rows associated with this block.
     *
     * @param id The UUID of the reference block
     * @return No content on success
     */
    @DeleteMapping("/{id}/refs")
    @Operation(
        summary = "Clear all references from a block",
        description = "Removes all reference entries for the specified block. " +
                "The block itself is not deleted, only its reference relationships are cleared."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "References cleared successfully"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block not found")
    )
    fun clearAllReferences(
        @PathVariable id: UUID
    ): ResponseEntity<Unit> {
        // TODO: Service method missing
        // Required: BlockReferenceService.clearAllReferences(blockId: UUID)
        // Should delete all BlockReferenceEntity rows where parentId = id
        //
        // Can potentially be implemented using repository directly:
        // val refs = blockReferenceRepository.findByBlockIdAndPathPrefix(id, "$")
        // blockReferenceRepository.deleteAllInBatch(refs)
        TODO("Requires new service method: clearAllReferences(blockId) or direct repository usage")
    }

    /**
     * Remove a single reference from a reference block.
     *
     * Use this endpoint when:
     * - Removing a single item from a reference list
     * - Clearing a single block reference
     *
     * For lists with duplicates, use the 'path' query parameter to specify which occurrence to remove.
     *
     * @param id The UUID of the reference block
     * @param entityType The type of the referenced entity
     * @param entityId The UUID of the referenced entity
     * @param path Optional path specifier for disambiguating duplicates (e.g., "$.items[3]")
     * @return No content on success
     */
    @DeleteMapping("/{id}/refs/{entityType}/{entityId}")
    @Operation(
        summary = "Remove a single reference",
        description = "Removes a specific reference entry by entity type and ID. " +
                "For reference lists with allowDuplicates=true, include the path parameter " +
                "to specify which occurrence to remove (e.g., ?path=$.items[3])."
    )
    @ApiResponses(
        ApiResponse(responseCode = "204", description = "Reference removed successfully"),
        ApiResponse(responseCode = "400", description = "Ambiguous deletion (multiple entries found, path required)"),
        ApiResponse(responseCode = "401", description = "Unauthorized access"),
        ApiResponse(responseCode = "404", description = "Block or reference not found")
    )
    fun removeReference(
        @PathVariable id: UUID,
        @PathVariable entityType: EntityType,
        @PathVariable entityId: UUID,
        @RequestParam(required = false) path: String?
    ): ResponseEntity<Unit> {
        // TODO: Service method missing
        // Required: BlockReferenceService.removeReference(blockId, entityType, entityId, path?)
        //
        // Logic needed:
        // 1. Query references by blockId + entityType + entityId
        // 2. If multiple found and path is null, return 400 (ambiguous)
        // 3. If path provided, filter to that specific path
        // 4. Delete the matching reference(s)
        // 5. For lists, renumber remaining items in that path prefix
        //
        // Can potentially be implemented using repository:
        // val refs = blockReferenceRepository.findByParentIdAndEntityTypeAndEntityId(id, entityType, entityId)
        // val toDelete = if (path != null) refs.filter { it.path == path } else refs
        // if (toDelete.size > 1 && path == null) throw BadRequestException("Multiple entries found")
        // blockReferenceRepository.deleteAllInBatch(toDelete)
        // // Then renumber remaining items if this was in a list
        TODO("Requires new service method: removeReference(blockId, entityType, entityId, path?) with renumbering logic")
    }
}
