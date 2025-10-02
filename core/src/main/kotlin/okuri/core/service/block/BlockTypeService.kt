package okuri.core.service.block

import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.BlockTypeScope
import okuri.core.models.block.BlockType
import okuri.core.models.block.request.CreateBlockTypeRequest
import okuri.core.repository.block.BlockTypeRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.util.ServiceUtil.findManyResults
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service layer for handling the management of block types and templates within the application.
 */
@Service
class BlockTypeService(
    private val blockTypeRepository: BlockTypeRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {
    /**
     * This function creates and publishes a new block type based on the provided request data.
     * It logs the creation activity for auditing purposes.
     */
    fun publishBlockType(request: CreateBlockTypeRequest): BlockType {
        authTokenService.getUserId().let { userId ->
            val entity = BlockTypeEntity.fromRequest(request)
            blockTypeRepository.save(entity).run {
                activityService.logActivity(
                    activity = okuri.core.enums.activity.Activity.BLOCK_TYPE,
                    operation = okuri.core.enums.util.OperationType.CREATE,
                    userId = userId,
                    organisationId = entity.organisationId,
                    targetId = entity.id,
                    additionalDetails = "Block Type '${entity.key}' created with ID: ${entity.id}"
                )

                return this.toModel()
            }
        }
    }

    /**
     * Append-only: create a new versioned row derived from `type`.
     * Assumes a unique constraint on (organisation_id, key, version).
     */
    fun updateBlockType(type: BlockType) {
        val userId = authTokenService.getUserId()
        val existing = findOrThrow { blockTypeRepository.findById(type.id) }

        // compute next version number (could also query max)
        val nextVersion = existing.version + 1

        val newRow = BlockTypeEntity(
            id = null,
            key = existing.key,
            displayName = type.name,
            description = type.description,
            organisationId = existing.organisationId,
            scope = existing.scope,
            system = existing.system,
            version = nextVersion,
            strictness = type.validationMode,
            schema = type.schema,
            archived = false, // new version starts unarchived unless specified otherwise
            displayStructure = type.display,
            // Add this property to your entity (nullable) to record provenance.
            sourceId = existing.id
        )

        val saved = blockTypeRepository.save(newRow)
        activityService.logActivity(
            activity = okuri.core.enums.activity.Activity.BLOCK_TYPE,
            operation = okuri.core.enums.util.OperationType.CREATE,
            userId = userId,
            organisationId = saved.organisationId,
            targetId = saved.id,
            additionalDetails = "Block Type '${saved.key}' forked to v${saved.version} from ${existing.id}"
        )
    }

    fun archiveBlockType(id: UUID, status: Boolean) {
        val userId = authTokenService.getUserId()
        val existing = findOrThrow { blockTypeRepository.findById(id) }
        if (existing.archived == status) return
        val updated = existing.copy(archived = status)
        blockTypeRepository.save(updated)
        activityService.logActivity(
            activity = okuri.core.enums.activity.Activity.BLOCK_TYPE,
            operation = if (status) okuri.core.enums.util.OperationType.DELETE
            else okuri.core.enums.util.OperationType.UPDATE,
            userId = userId,
            organisationId = existing.organisationId,
            targetId = existing.id,
            additionalDetails = "Block Type '${existing.key}' archive=${status}"
        )
    }

    /**
     * This function changes the visibility scope of a block type.
     * The scope determines who can access and use the block type within the application.
     */
    fun changeBlockTypeVisibility(scope: BlockTypeScope) {
        TODO()
    }

    /**
     * This function creates a fork of an existing block type, allowing for modifications
     */
    fun forkBlockType(source: BlockType, scope: BlockTypeScope) {
        TODO()
    }

    /**
     * This function retrieves a block type based on its unique key.
     * @param key The unique key of the block type to retrieve.
     * @return The block type associated with the given key, or null if not found.
     */
    fun getEntityByKey(key: String): BlockTypeEntity {
        return findOrThrow { blockTypeRepository.findByKey(key) }
    }

    /**
     * This function retrieves block types associated with a specific organisation.
     * It will also return all available pre-generated system block types.
     *
     * @param organisationId The ID of the organisation to filter block types by.
     * @return A list of block types associated with the given organisation ID.
     */
    fun getBlockTypesByOrganisation(organisationId: UUID, includeSystemResults: Boolean = true): List<BlockType> {
        return findManyResults {
            blockTypeRepository.findByOrganisationIdOrSystem(
                organisationId,
                includeSystemResults
            )
        }.map { it.toModel() }
    }

    /**
     * This function retrieves block types based on scope, organisation ID, and additional filters.
     *
     * @param scope The scope of the block types to retrieve (e.g., ORGANISATION, GLOBAL).
     * @param organisationId The ID of the organisation to filter block types by.
     * @param filter A map of additional filters to apply to the block type retrieval.
     *
     * @return A list of block types matching the specified criteria.
     *
     * Todo: Implement filtering logic based on the provided filter map.
     */
    fun getBlockTypes(scope: BlockTypeScope, organisationId: UUID?, filter: Map<String, Any>?): List<BlockType> {
        TODO()
    }

    /**
     * Fetch latest version of a key within an org, with optional system fallback.
     */
    fun getLatestByKey(organisationId: UUID?, key: String, includeSystem: Boolean = true): BlockTypeEntity {
        return if (organisationId != null) {
            blockTypeRepository.findTopByOrganisationIdAndKeyOrderByVersionDesc(organisationId, key)
                ?: if (includeSystem)
                    blockTypeRepository.findTopBySystemTrueAndKeyOrderByVersionDesc(key)
                        ?: throw NoSuchElementException("BlockType not found for key=$key")
                else throw NoSuchElementException("BlockType not found for key=$key")
        } else {
            // system-level lookup
            blockTypeRepository.findTopBySystemTrueAndKeyOrderByVersionDesc(key)
                ?: throw NoSuchElementException("BlockType not found for key=$key")
        }
    }
}