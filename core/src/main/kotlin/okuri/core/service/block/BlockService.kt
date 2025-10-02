package okuri.core.service.block

import jakarta.transaction.Transactional
import okuri.core.entity.block.BlockEntity
import okuri.core.entity.block.BlockReferenceEntity
import okuri.core.enums.block.isStrict
import okuri.core.models.block.Block
import okuri.core.models.block.request.BlockTree
import okuri.core.models.block.request.CreateBlockRequest
import okuri.core.models.block.structure.BlockMetadata
import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.service.schema.SchemaService
import okuri.core.service.schema.SchemaValidationException
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service layer for managing blocks within the application.
 */
@Service
class BlockService(
    private val blockRepository: BlockRepository,
    private val blockTypeService: BlockTypeService,
    private val blockReferenceRepository: BlockReferenceRepository,
    private val blockReferenceService: BlockReferenceService,
    private val schemaService: SchemaService
) {
    /**
     * This function creates a new block based on the provided request data.
     * It ensures that the block type specified in the request exists before creating the block.
     * Depending on the block type's validation scope. It will also examine the payload and cross validate with the
     * provided schema. And throw an error if the payload does not conform to the schema.
     *
     * @param request The request object containing details for the new block.
     * @return The created block.
     */
    @Transactional
    fun createBlock(request: CreateBlockRequest): Block {
        val typeEntity = blockTypeService.getLatestByKey(
            request.organisationId?.let(UUID::fromString),
            request.key,
            includeSystem = true
        )
        if (typeEntity.archived) throw IllegalStateException("BlockType '${typeEntity.key}' is archived")

        val scope = typeEntity.strictness
        val payload = request.payload ?: emptyMap<String, Any?>()

        val errors = schemaService.validate(typeEntity.schema, payload, scope)
        if (scope.isStrict() && errors.isNotEmpty()) {
            throw SchemaValidationException(errors)
        }

        val entity = BlockEntity(
            organisationId = requireNotNull(typeEntity.organisationId) { "org required" },
            type = typeEntity,
            name = request.name,
            payload = payload as BlockMetadata, // ensure type alias
            parent = null,
            archived = false
        )
        val saved = blockRepository.save(entity)

        // Build references table from payload
        val refs = blockReferenceService.extractReferences(payload).map {
            BlockReferenceEntity(
                block = saved,
                entityType = it.type,
                entityId = it.id
            )
        }
        if (refs.isNotEmpty()) blockReferenceRepository.saveAll(refs)

        return saved.toModel().copy(
            validationErrors = if (errors.isEmpty()) null else errors
        )
    }

    /**
     * This function updates an existing block with new information.
     * It ensures that the block type specified in the block exists before updating the block.
     * It will also examine the payload and cross validate with the provided schema based on the provided validation settings.
     *
     * @param block The block model containing updated information.
     * @return The updated block.
     */
    @Transactional
    fun updateBlock(block: Block): Block {
        val existing = blockRepository.findById(block.id).orElseThrow()
        val typeEntity = existing.type
        val scope = typeEntity.strictness

        // Deep-merge payloads
        @Suppress("UNCHECKED_CAST")
        val mergedPayload = deepMergeJson(
            objectOld = existing.payload as Map<String, Any?>,
            objectNew = block.payload as Map<String, Any?>
        )

        val errors = schemaService.validate(typeEntity.schema, mergedPayload, scope)
        if (scope.isStrict() && errors.isNotEmpty()) throw SchemaValidationException(errors)

        val updated = existing.copy(
            name = block.name ?: existing.name,
            payload = mergedPayload as BlockMetadata
        )
        val saved = blockRepository.save(updated)

        // Rebuild references (simple strategy)
        blockReferenceRepository.deleteByBlockId(saved.id!!)
        val refs = blockReferenceService.extractReferences(mergedPayload).map {
            BlockReferenceEntity(block = saved, entityType = it.type, entityId = it.id)
        }
        if (refs.isNotEmpty()) blockReferenceRepository.saveAll(refs)

        return saved.toModel().copy(validationErrors = if (errors.isEmpty()) null else errors)
    }

    /**
     * This function retrieves a block by its ID, with options to expand references and set maximum depth for child blocks.
     * If expandRefs is true, any referenced blocks will be fully expanded up to the specified maxDepth.
     * If expandRefs is false, only the immediate children of the block will be included, without expanding references.
     * The maxDepth parameter controls how deep the child blocks are fetched in the hierarchy.
     * If maxDepth is 1, only the immediate children are included. If maxDepth is greater than 1, the function will recursively fetch child blocks up to the specified depth.
     *
     * @param blockId The UUID of the block to be retrieved.
     * @param expandRefs Whether to expand referenced blocks or not. Default is false.
     * @param maxDepth The maximum depth of child blocks to retrieve. Default is 1.
     *
     * @return The block tree starting from the specified block, including its children and expanded references as per the parameters.
     */
    fun getBlock(blockId: UUID, expandRefs: Boolean = false, maxDepth: Int = 1): BlockTree {
        TODO()
    }

    /**
     * This function will update the archival status of a block.
     * If a block is archived, all it's children that are not being actively referenced by another block will also be archived.
     * For a block to be unarchived, it's parent block must also be unarchived first.
     *
     * @param block The block to be archived or unarchived.
     * @param archive True to archive the block, false to unarchive it.
     *
     * @return The updated block tree starting from the affected block.
     *
     */
    fun archiveBlock(block: Block, archive: Boolean): BlockTree {
        TODO()
    }

    /**
     * Deletes a block by its ID.
     * This will then also delete all child blocks who are not referenced by any other blocks in the system.
     *
     * @param blockId The UUID of the block to be deleted.
     * @return The number of blocks deleted.
     */
    fun deleteBlock(blockId: UUID): Int {
        TODO()
    }

    /** Simple deep merge for Map<String, Any?> */
    @Suppress("UNCHECKED_CAST")
    private fun deepMergeJson(objectOld: Map<String, Any?>, objectNew: Map<String, Any?>): Map<String, Any?> {
        val result = objectOld.toMutableMap()
        for ((k, vNew) in objectNew) {
            val vOld = result[k]
            result[k] = when {
                vOld is Map<*, *> && vNew is Map<*, *> ->
                    deepMergeJson(vOld as Map<String, Any?>, vNew as Map<String, Any?>)

                else -> vNew
            }
        }
        return result
    }
}