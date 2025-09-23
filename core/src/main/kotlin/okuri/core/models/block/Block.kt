package okuri.core.models.block

import okuri.core.models.block.structure.BlockMetadata
import java.io.Serializable
import java.time.ZonedDateTime
import java.util.*

/**
 * A Block is a modular unit of content or functionality within the application.
 *
 * Block entity would record its parent. But for data modelling, this would already be
 * apart of a tree structure. So its internal structuring would already be handled
 */
data class Block(
    val id: UUID,
    val name: String?,
    val organisationId: UUID,
    val type: BlockType,
    val payload: BlockMetadata,
    val archived: Boolean,
    // Keep these hidden unless within an internal organisation context
    var createdAt: ZonedDateTime? = null,
    var updatedAt: ZonedDateTime? = null,
    var createdBy: UUID? = null,
    var updatedBy: UUID? = null,
) : Serializable

