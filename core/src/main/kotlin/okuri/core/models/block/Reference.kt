package okuri.core.models.block

import okuri.core.enums.block.BlockReferenceWarning
import okuri.core.enums.core.EntityType
import java.util.*

data class Reference<E>(
    // We can build references without IDs for Lazy Loaded references. We will replace it when objects are loaded post tree build
    val id: UUID? = null,
    val entityType: EntityType,
    val entityId: UUID,
    val path: String? = null,
    val orderIndex: Int? = null,
    val entity: E? = null,
    val warning: BlockReferenceWarning? = null,
)