package okuri.core.service.block

import jakarta.transaction.Transactional
import okuri.core.entity.activity.ActivityLogEntity
import okuri.core.entity.block.BlockChildEntity
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

            // Need to overwrite the layout and associated blocks. Would need to recreate and re-map forced data onto existing blocks as-well.
            // This would need to accommodate for block operations that may have occurred or negated previous operations in a confliction version
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

            // Fetch references for blocks that were affected by re-parenting or re-ordering operations
            val dependentBlockIds = normalizedOperations.entries.filter { entry ->
                entry.value.any {
                    it.data.type == BlockOperationType.MOVE_BLOCK ||
                            it.data.type == BlockOperationType.REORDER_BLOCK
                }
            }.flatMap { entry ->
                entry.value.filter {
                    it.data.type == BlockOperationType.MOVE_BLOCK ||
                            it.data.type == BlockOperationType.REORDER_BLOCK
                }.flatMap {
                    when (it.data) {
                        is MoveBlockOperation -> listOfNotNull(it.data.fromParentId, it.data.toParentId)
                        is ReorderBlockOperation -> listOf(it.data.parentId)
                        else -> emptyList()
                    }
                }
            }.toSet()

            val blocks: Map<UUID, BlockEntity> = blockService.getBlocks(blockIds)
            val edges: Map<UUID, List<BlockChildEntity>> = blockChildrenService.getChildrenForBlocks(blockIds)

            // 2a. Execute Operations
            normalizedOperations.entries.forEach { entry ->
                val (blockId, operations) = entry
                val block: BlockEntity? = blocks[blockId]
                val childEdges: List<BlockChildEntity> = edges[blockId] ?: emptyList()
                executeOperations(
                    id = blockId,
                    operations = operations,
                    block = block,
                    children = childEdges
                )
            }
            // Save layout snapshot
            blockTreeLayoutService.updateLayoutSnapshot(layout, request.layout, request.version)
            return SaveEnvironmentResponse(
                success = true,
                conflict = false,
                latestVersion = request.version,
                lastModifiedAt = layout.updatedAt,
                lastModifiedBy = layout.updatedBy?.toString()
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
        id: UUID,
        operations: List<StructuralOperationRequest>,
        block: BlockEntity? = null,
        children: List<BlockChildEntity>
    ) {

    }


}