package okuri.core.service.block

import jakarta.transaction.Transactional
import okuri.core.entity.activity.ActivityLogEntity
import okuri.core.entity.block.BlockEntity
import okuri.core.enums.activity.Activity
import okuri.core.enums.block.request.BlockOperationType
import okuri.core.enums.core.EntityType
import okuri.core.enums.util.OperationType
import okuri.core.models.block.operation.*
import okuri.core.models.block.request.SaveEnvironmentRequest
import okuri.core.models.block.request.StructuralOperationRequest
import okuri.core.models.block.response.SaveEnvironmentResponse
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

@Service
class BlockEnvironmentService(
    private val blockService: BlockService,
    private val blockTreeLayoutService: BlockTreeLayoutService,
    private val blockChildrenService: BlockChildrenService,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
) {

    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    @Transactional
    fun saveBlockEnvironment(request: SaveEnvironmentRequest): SaveEnvironmentResponse {
        authTokenService.getUserId().let { userId ->
            val layout = blockTreeLayoutService.fetchLayoutById(request.layoutId)
            if (request.version <= layout.version && !request.force) {
                return SaveEnvironmentResponse(
                    success = false,
                    conflict = true,
                    latestVersion = layout.version,
                    lastModifiedAt = layout.updatedAt,
                    lastModifiedBy = layout.updatedBy?.toString()
                )
            }

            /** Need to overwrite the layout and associated blocks.
             * Would need to recreate and re-map forced data onto existing blocks as-well.
             * This would need to accommodate for block operations that may have occurred or negated previous operations in a conflicted version **/
            if (request.force) {
                TODO()
            }

            request.operations.map { operation ->
                logBlockOperation(
                    userId = userId,
                    organisationId = request.organisationId,
                    operation = operation
                )
            }.run {
                activityService.logActivities(this)
            }


            // 1.  Filter and de-duplicate operations => Ensure that only one operation per block per type is processed
            val normalizedOperations: Map<UUID, List<StructuralOperationRequest>> =
                normalizeOperations(request.operations)

            // Fetch all involved blocks, references and children ahead of processing
            // Fetch blocks that have operations after normalization
            val blockIds = normalizedOperations.entries.filter { it.value.isNotEmpty() }.map { it.key }.toSet()
            val blocks: Map<UUID, BlockEntity> = blockService.getBlocks(blockIds)

            // 2a. Execute Operations and collect ID mappings
            val allIdMappings = mutableMapOf<UUID, UUID>()

            normalizedOperations.entries.forEach { entry ->
                val (blockId, operations) = entry
                val block: BlockEntity? = blocks[blockId]

                val mappings = executeOperations(
                    operations = operations,
                    block = block,
                )

                allIdMappings.putAll(mappings)
            }

            // Save layout snapshot
            blockTreeLayoutService.updateLayoutSnapshot(layout, request.layout, request.version)
            return SaveEnvironmentResponse(
                success = true,
                conflict = false,
                newVersion = request.version,
                latestVersion = request.version,
                lastModifiedAt = layout.updatedAt,
                lastModifiedBy = layout.updatedBy?.toString(),
                idMappings = allIdMappings
            )
        }
    }

    private fun logBlockOperation(
        userId: UUID,
        organisationId: UUID,
        operation: StructuralOperationRequest
    ): ActivityLogEntity {
        return ActivityLogEntity(
            userId = userId,
            organisationId = organisationId,
            activity = Activity.BLOCK_OPERATION,
            operation = when (operation.data.type) {
                BlockOperationType.ADD_BLOCK -> OperationType.CREATE
                BlockOperationType.REMOVE_BLOCK -> OperationType.DELETE
                else -> OperationType.UPDATE
            },
            entityType = EntityType.BLOCK,
            entityId = operation.data.blockId,
            timestamp = operation.timestamp,
            details = when (operation.data) {
                is AddBlockOperation -> {
                    mapOf(
                        "type" to operation.data.type,
                        "blockId" to operation.data.blockId.toString(),
                        "parentId" to operation.data.parentId.toString(),
                    )
                }

                is RemoveBlockOperation -> {
                    mapOf(
                        "type" to operation.data.type,
                        "blockId" to operation.data.blockId.toString()
                    )
                }
                // Todo: Calculate readable diffs for updates
                is UpdateBlockOperation -> {
                    mapOf(
                        "type" to operation.data.type,
                        "blockId" to operation.data.blockId.toString(),
                    )
                }

                is MoveBlockOperation -> {
                    mapOf(
                        "type" to operation.data.type,
                        "oldParentId" to operation.data.fromParentId,
                        "newParentId" to operation.data.toParentId
                    )
                }

                is ReorderBlockOperation -> {
                    mapOf(
                        "type" to operation.data.type,
                        "previousIndex" to operation.data.fromIndex,
                        "newIndex" to operation.data.toIndex
                    )
                }
            }
        )


    }

    fun normalizeOperations(operations: List<StructuralOperationRequest>): Map<UUID, List<StructuralOperationRequest>> {

        // 2. Group by blockId
        return operations.groupBy { it.data.blockId }.values.flatMap { blockOperations ->
            reduceBlockOperations(blockOperations).sortedBy { it.timestamp }
        }.groupBy { it.data.blockId }
    }

    fun reduceBlockOperations(ops: List<StructuralOperationRequest>): List<StructuralOperationRequest> {

        // If block is added then removed → skip both
        val hasAdd = ops.any { it.data.type == BlockOperationType.ADD_BLOCK }
        val hasRemove = ops.any { it.data.type == BlockOperationType.REMOVE_BLOCK }

        if (hasAdd && hasRemove) {
            return emptyList()
        }

        // If block is deleted. No need to process other operations
        if (hasRemove) {
            return ops.filter { it.data.type == BlockOperationType.REMOVE_BLOCK }
        }

        // Now: no DELETE in this block’s ops

        // Rule 4a/b: If there is a CREATE, drop ops before it and ensure CREATE is first
        val createOp = ops.firstOrNull { it.data.type == BlockOperationType.ADD_BLOCK }

        // Keep only ops at or after CREATE (given it exists)
        val relevantOps = if (createOp != null) {
            ops.filter { it.timestamp >= createOp.timestamp }
        } else {
            ops
        }

        // From here we enforce "only one operation per block per type"
        // by keeping only the last op per type.
        val lastByType: Map<BlockOperationType, StructuralOperationRequest> =
            relevantOps.groupBy { it.data.type }
                .mapValues { (_, sameTypeOps) ->
                    sameTypeOps.maxByOrNull { it.timestamp }!!
                }

        val result = mutableListOf<StructuralOperationRequest>()

        // If we have CREATE, ensure it's first in the list
        if (createOp != null) {
            val finalCreate = lastByType[BlockOperationType.ADD_BLOCK] ?: createOp
            result.addFirst(finalCreate)
        }

        // Add remaining types (UPDATE / REPARENT / REPOSITION), ordered by timestamp
        val others = lastByType
            .filterKeys { it != BlockOperationType.ADD_BLOCK }
            .values
            .sortedBy { it.timestamp }

        result += others

        return result
    }

    private fun executeOperations(
        operations: List<StructuralOperationRequest>,
        block: BlockEntity? = null,
    ): Map<UUID, UUID> {
        // PHASE 1: Handle REMOVE operations (will need to cascade delete children)
        val removeOps = operations.filter { it.data.type == BlockOperationType.REMOVE_BLOCK }
        if (removeOps.isNotEmpty()) {
            val blockIdsToRemove = removeOps.map { it.data.blockId }.toSet()

            // Collect all blocks and children to delete
            val cascadeResult = blockChildrenService.prepareRemovalCascade(blockIdsToRemove)

            // Batch delete children entities
            if (cascadeResult.childEntitiesToDelete.isNotEmpty()) {
                blockChildrenService.deleteAllInBatch(cascadeResult.childEntitiesToDelete)
            }

            // Batch delete blocks
            if (cascadeResult.blocksToDelete.isNotEmpty()) {
                blockService.deleteAllById(cascadeResult.blocksToDelete)
            }

            return emptyMap() // No ID mappings needed if block is deleted
        }

        // PHASE 2: Handle ADD operations (create blocks + children)
        val addOps = operations.filter { it.data.type == BlockOperationType.ADD_BLOCK }
            .map { it.data as AddBlockOperation }

        val newBlocks = mutableListOf<BlockEntity>()
        val childAdditions: List<AddBlockOperation> = addOps.filter { it.parentId != null }

        addOps.forEach { addOp ->
            val blockData = addOp.block.block
            val blockTypeEntity = blockService.getBlockTypeEntity(blockData.type.id)

            val entity = BlockEntity(
                id = null, // Let DB generate new ID
                organisationId = blockData.organisationId,
                type = blockTypeEntity,
                name = blockData.name,
                payload = blockData.payload,
                archived = false
            )

            newBlocks.add(entity)
        }

        // Batch save new blocks
        val savedBlocks = if (newBlocks.isNotEmpty()) {
            blockService.saveAll(newBlocks)
        } else {
            emptyList()
        }

        // Map temporary IDs to real IDs
        val idMapping = mutableMapOf<UUID, UUID>()
        addOps.zip(savedBlocks).forEach { (addOp, savedBlock) ->
            idMapping[addOp.blockId] = savedBlock.id!!
        }

        // Helper function to resolve IDs (temp -> real)
        val resolveId: (UUID) -> UUID = { id -> idMapping[id] ?: id }

        // Update child additions with real IDs (resolve both child and parent)
        val resolvedChildAdditions = childAdditions.map { addition ->
            addition.copy(
                blockId = resolveId(addition.blockId),
                parentId = resolveId(addition.parentId!!) // Also resolve parent in case it was newly added
            )
        }

        // Batch save parent-child relationships
        if (resolvedChildAdditions.isNotEmpty()) {
            val allChildren = blockChildrenService.getChildrenForBlocks(
                resolvedChildAdditions.mapNotNull { it.parentId }
            )
            val childEntities = blockChildrenService.prepareChildAdditions(
                resolvedChildAdditions,
                allChildren
            )
            if (childEntities.isNotEmpty()) {
                blockChildrenService.saveAll(childEntities)
            }
        }

        // PHASE 3: Handle UPDATE operations (modify existing blocks)
        val updateOps = operations.filter { it.data.type == BlockOperationType.UPDATE_BLOCK }
            .map { it.data as UpdateBlockOperation }

        val blocksToUpdate = mutableListOf<BlockEntity>()
        updateOps.forEach { updateOp ->
            // Resolve block ID in case it was newly added
            val resolvedBlockId = resolveId(updateOp.blockId)

            // Try to find in existing blocks first, or in newly saved blocks
            val existingBlock = block?.takeIf { it.id == resolvedBlockId }
                ?: savedBlocks.find { it.id == resolvedBlockId }

            // TODO: Validate content of new block

            existingBlock?.let { existing ->
                val updatedContent = updateOp.updatedContent.block

                // Update payload with new content
                val updated = existing.copy(
                    name = updatedContent.name ?: existing.name,
                    payload = updatedContent.payload
                )
                blocksToUpdate.add(updated)
            }
        }

        // Batch save updated blocks
        if (blocksToUpdate.isNotEmpty()) {
            blockService.saveAll(blocksToUpdate)
        }

        // PHASE 4: Handle MOVE operations (reparent blocks)
        val moveOps = operations.filter { it.data.type == BlockOperationType.MOVE_BLOCK }
            .map { it.data as MoveBlockOperation }

        if (moveOps.isNotEmpty()) {
            val moves = moveOps.map { moveOp ->
                moveOp.copy(
                    blockId = resolveId(moveOp.blockId), // Resolve child ID
                    fromParentId = moveOp.fromParentId?.let { resolveId(it) }, // Resolve old parent ID
                    toParentId = moveOp.toParentId?.let { resolveId(it) } // Resolve new parent ID
                )

            }

            val affectedParents = moveOps.flatMap {
                listOfNotNull(
                    it.fromParentId?.let { parentId -> resolveId(parentId) },
                    it.toParentId?.let { parentId -> resolveId(parentId) }
                )
            }.toSet()

            val existingChildren = blockChildrenService.getChildrenForBlocks(affectedParents)
            val moveResult = blockChildrenService.prepareChildMoves(moves, existingChildren)

            // Batch delete old edges
            if (moveResult.childEntitiesToDelete.isNotEmpty()) {
                blockChildrenService.deleteAllInBatch(moveResult.childEntitiesToDelete)
            }

            // Batch save new edges
            if (moveResult.childEntitiesToSave.isNotEmpty()) {
                blockChildrenService.saveAll(moveResult.childEntitiesToSave)
            }
        }

        // PHASE 5: Handle REORDER operations (change indices within parent)
        val reorderOps = operations.filter { it.data.type == BlockOperationType.REORDER_BLOCK }
            .map { it.data as ReorderBlockOperation }

        if (reorderOps.isNotEmpty()) {
            val reorders = reorderOps.map { reorderOp ->
                reorderOp.copy(
                    blockId = resolveId(reorderOp.blockId), // Resolve child ID
                    parentId = resolveId(reorderOp.parentId) // Resolve parent ID
                )
            }

            val affectedParents = reorders.map { resolveId(it.parentId) }.toSet()
            val existingChildren = blockChildrenService.getChildrenForBlocks(affectedParents)
            val reorderedEntities = blockChildrenService.prepareChildReorders(reorders, existingChildren)

            // Batch save reordered edges
            if (reorderedEntities.isNotEmpty()) {
                blockChildrenService.saveAll(reorderedEntities)
            }
        }

        return idMapping
    }


}