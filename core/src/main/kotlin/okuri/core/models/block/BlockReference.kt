package okuri.core.models.block

import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import java.util.*

data class BlockReference<E>(
    val id: UUID,
    val entityType: EntityType,
    val entityId: UUID,
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val entity: E?,
    val ownership: BlockOwnership,
    val orderIndex: Int? = null,
    val path: String,
)