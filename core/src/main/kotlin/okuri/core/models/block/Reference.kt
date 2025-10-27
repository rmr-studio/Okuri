package okuri.core.models.block

import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockReferenceWarning
import okuri.core.enums.core.EntityType
import okuri.core.models.client.Client
import okuri.core.models.organisation.Organisation
import java.util.*

data class Reference(
    // We can build references without IDs for Lazy Loaded references. We will replace it when objects are loaded post tree build
    val id: UUID? = null,
    val entityType: EntityType,
    val entityId: UUID,
    val path: String? = null,
    val orderIndex: Int? = null,
    // Polymorphic payload
    // TODO: Add other entity types when developed
    @field:Schema(
        description = "Inline, discriminated entity",
        oneOf = [Client::class, Organisation::class, BlockTree::class]
    )
    val entity: Referenceable? = null,
    val warning: BlockReferenceWarning? = null,
)

