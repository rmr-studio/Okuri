package okuri.core.models.block

import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockReferenceWarning
import okuri.core.enums.core.EntityType
import java.util.*

data class Reference<E>(
    // We can build references without IDs for Lazy Loaded references. We will replace it when objects are loaded post tree build
    val id: UUID? = null,
    val entityType: EntityType,
    val entityId: UUID,
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val path: String? = null,
    val orderIndex: Int? = null,
    val entity: E? = null,
    val warning: BlockReferenceWarning? = null,
)