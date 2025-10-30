package okuri.core.service.block

import okuri.core.configuration.auth.OrganisationSecurity
import okuri.core.entity.block.BlockTypeEntity
import okuri.core.enums.activity.Activity
import okuri.core.enums.util.OperationType
import okuri.core.models.block.BlockType
import okuri.core.models.block.request.CreateBlockTypeRequest
import okuri.core.repository.block.BlockTypeRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.util.ServiceUtil.findManyResults
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service layer for handling the management of block types and templates within the application.
 */
@Service
class BlockTypeService(
    private val blockTypeRepository: BlockTypeRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService,
    private val organisationSecurity: OrganisationSecurity
) {
    /**
     * Creates and publishes a new block type from the provided request and records an audit activity.
     *
     * @param request Data for the new block type.
     * @return The saved BlockType model representing the published block type.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#request.organisationId)")
    fun publishBlockType(request: CreateBlockTypeRequest): BlockType {
        authTokenService.getUserId().let { userId ->
            val entity = BlockTypeEntity.fromRequest(request)
            blockTypeRepository.save(entity).run {
                activityService.logActivity(
                    activity = Activity.BLOCK_TYPE,
                    operation = OperationType.CREATE,
                    userId = userId,
                    organisationId = this.organisationId,
                    targetId = this.id,
                    additionalDetails = "Block Type '${this.key}' created with ID: ${this.id}"
                )

                return this.toModel()
            }
        }
    }

    /**
     * Create a new versioned BlockType row derived from the provided BlockType and record a creation activity.
     *
     * This performs append-only versioning: a new entity is saved with an incremented version, sourceId set to the original entity's id, and archived set to false. Assumes a unique constraint on (organisation_id, key, version).
     *
     * @param type The BlockType containing the new values and the id of the existing version to fork from.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#type.organisationId)")
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
            system = existing.system,
            version = nextVersion,
            strictness = type.strictness,
            schema = type.schema,
            archived = false, // new version starts unarchived unless specified otherwise
            displayStructure = type.display,
            // Add this property to your entity (nullable) to record provenance.
            sourceId = existing.id
        )

        blockTypeRepository.save(newRow).run {
            activityService.logActivity(
                activity = Activity.BLOCK_TYPE,
                operation = OperationType.CREATE,
                userId = userId,
                organisationId = this.organisationId,
                targetId = this.id,
                additionalDetails = "Block Type '${this.key}' forked to v${this.version} from ${existing.id}"
            )
        }
    }

    /**
     * Archives or restores a block type and records the change as an activity.
     *
     * Updates the archived flag of the block type identified by [id] to [status], persists the change,
     * and logs an ARCHIVE (when `status` is true) or RESTORE (when `status` is false) activity. If the
     * block type already has the requested archived state, no changes or activity are made.
     *
     * @param id The UUID of the block type to update.
     * @param status `true` to archive the block type, `false` to restore it.
     */
    fun archiveBlockType(id: UUID, status: Boolean) {
        val userId = authTokenService.getUserId()
        val existing = findOrThrow { blockTypeRepository.findById(id) }
        existing.organisationId.let {
            require(it != null) { "Cannot archive system block types" }
            organisationSecurity.hasOrg(it).run {
                if (!this) {
                    throw AccessDeniedException("Unauthorized to archive block type for organisation $it")
                }
            }
        }

        if (existing.archived == status) return
        val updated = existing.copy(archived = status)
        blockTypeRepository.save(updated)
        activityService.logActivity(
            activity = Activity.BLOCK_TYPE,
            operation = if (status) OperationType.ARCHIVE
            else OperationType.RESTORE,
            userId = userId,
            organisationId = existing.organisationId,
            targetId = existing.id,
            additionalDetails = "Block Type '${existing.key}' archive=${status}"
        )
    }

    /**
     * Retrieves the block type entity with the specified unique key.
     *
     * Throws if no block type with the given key exists.
     *
     * @param key The unique key identifying the block type.
     * @return The matching BlockTypeEntity.
     */
    fun getEntityByKey(key: String): BlockTypeEntity {
        return findOrThrow { blockTypeRepository.findByKey(key) }
    }

    /**
     * Fetches block types for the given organisation, optionally including system block types.
     *
     * @param includeSystemResults When `true`, include pre-defined system block types in the result.
     * @return A list of block types for the organisation; includes system block types when `includeSystemResults` is `true`.
     */
    fun getBlockTypes(organisationId: UUID, includeSystemResults: Boolean = true): List<BlockType> {
        return findManyResults {
            blockTypeRepository.findByOrganisationIdOrSystem(
                organisationId,
                includeSystemResults
            )
        }.map { it.toModel() }
    }

    /**
     * Retrieve a block type entity by key, preferring an organisation-scoped version and falling back to a system-scoped version.
     *
     * @param key The unique key of the block type.
     * @param organisationId The organisation UUID to prefer when searching; if null or no organisation-scoped match is found, a system-scoped block type is used.
     * @param version Optional specific version to fetch; when null the latest version is returned.
     * @return The matching BlockTypeEntity.
     * @throws NoSuchElementException If no matching block type is found for the given parameters.
     */
    fun getByKey(key: String, organisationId: UUID?, version: Int?): BlockTypeEntity {
        // Find from Organisation
        if (organisationId != null) {
            if (version != null) {
                findOrThrow {
                    blockTypeRepository.findByOrganisationIdAndKeyAndVersion(
                        organisationId,
                        key,
                        version
                    )
                }.let { return it }
            } else {
                blockTypeRepository.findTopByOrganisationIdAndKeyOrderByVersionDesc(
                    organisationId,
                    key
                )?.let { return it }
            }
        }
        // Fetch from system
        return if (version != null) {
            findOrThrow {
                blockTypeRepository.findBySystemTrueAndKeyAndVersion(
                    key,
                    version
                )
            }
        } else {
            blockTypeRepository.findTopBySystemTrueAndKeyOrderByVersionDesc(key)
                ?: throw NoSuchElementException("No BlockType found for key '$key'")
        }
    }

    /**
     * Retrieve a block type entity by its id.
     *
     * @param id The UUID of the block type to retrieve.
     * @return The `BlockTypeEntity` matching the given id.
     */
    fun getById(id: UUID): BlockTypeEntity {
        return findOrThrow { blockTypeRepository.findById(id) }
    }

}