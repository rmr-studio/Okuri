package okuri.core.service.block

import okuri.core.enums.block.BlockTypeScope
import okuri.core.models.block.BlockType
import okuri.core.models.block.request.CreateBlockTypeRequest
import okuri.core.repository.block.BlockTypeRepository
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service layer for handling the management of block types and templates within the application.
 */
@Service
class BlockTypeService(
    private val blockTypeRepository: BlockTypeRepository
) {
    fun publishBlockType(request: CreateBlockTypeRequest) {}
    fun updateBlockType(type: BlockType) {}
    fun forkBlockType(source: BlockType, scope: BlockTypeScope) {}
    fun getBlockTypeById(id: UUID): BlockType {
        TODO()
    }

    /**
     * This function retrieves a block type based on its unique key.
     * @param key The unique key of the block type to retrieve.
     * @return The block type associated with the given key, or null if not found.
     */
    fun getBlockTypeByKey(key: String): BlockType? {
        TODO()
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