package okuri.core.service.block

import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.block.BlockTypeScope
import okuri.core.models.block.BlockType
import okuri.core.models.block.request.CreateBlockTypeRequest
import okuri.core.repository.block.BlockTypeRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
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
    fun publishBlockType(request: CreateBlockTypeRequest) {
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
            }
        }
    }

    /**
     * This function updates an existing block type with new information.
     * This update function does not allow changing the scope of the block type.
     *
     * @param type The block type model containing updated information.
     * @throws NotFoundException if the block type with the given ID does not exist.
     *
     */
    fun updateBlockType(type: BlockType) {
        authTokenService.getUserId().let { userId ->
            findOrThrow(type.id, blockTypeRepository::findById).let { existing ->
                val updated = existing.updateFromModel(type)
                blockTypeRepository.save(updated).run {
                    activityService.logActivity(
                        activity = okuri.core.enums.activity.Activity.BLOCK_TYPE,
                        operation = okuri.core.enums.util.OperationType.UPDATE,
                        userId = userId,
                        organisationId = existing.organisationId,
                        targetId = existing.id,
                        additionalDetails = "Block Type '${existing.key}' updated with ID: ${existing.id}"
                    )
                }
            }

        }

    }

    /**
     * This function archives a block type identified by its unique ID.
     * The block type will still be visible to users who are currently using it in their layouts
     * but cannot be used in new blocks.
     */
    fun archiveBlockType(id: UUID) {
        authTokenService.getUserId().let { userId ->
            findOrThrow(id, blockTypeRepository::findById).let { existing ->
                val archived = existing.copy(archived = true)
                blockTypeRepository.save(archived).run {
                    activityService.logActivity(
                        activity = okuri.core.enums.activity.Activity.BLOCK_TYPE,
                        operation = okuri.core.enums.util.OperationType.DELETE,
                        userId = userId,
                        organisationId = existing.organisationId,
                        targetId = existing.id,
                        additionalDetails = "Block Type '${existing.key}' archived with ID: ${existing.id}"
                    )
                }
            }
        }
    }

    /**
     * This function changes the visibility scope of a block type.
     * The scope determines who can access and use the block type within the application.
     */
    fun changeBlockTypeVisibility(scope: BlockTypeScope) {

    }

    /**
     * This function creates a fork of an existing block type, allowing for modifications
     */
    fun forkBlockType(source: BlockType, scope: BlockTypeScope) {}

    /**
     * This function retrieves a block type based on its unique key.
     * @param key The unique key of the block type to retrieve.
     * @return The block type associated with the given key, or null if not found.
     */
    fun getEntityByKey(key: String): BlockTypeEntity {
        return findOrThrow(key, blockTypeRepository::findByKey)
    }

    /**
     * This function retrieves block types associated with a specific organisation.
     * @param organisationId The ID of the organisation to filter block types by.
     * @return A list of block types associated with the given organisation ID.
     */
    fun getBlockTypesByOrganisation(organisationId: UUID): List<BlockType> {
        TODO()
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
    fun getBlockTypes(scope: BlockTypeScope, organisationId: UUID?, filter: Map<String, Any>?) {}
}