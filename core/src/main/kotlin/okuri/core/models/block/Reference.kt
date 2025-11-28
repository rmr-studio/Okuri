package okuri.core.models.block

import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.node.BlockReferenceWarning
import okuri.core.enums.core.EntityType
import okuri.core.models.block.tree.BlockTree
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
    @field:Schema(
        oneOf = [
            Client::class,
            Organisation::class,
            BlockTree::class
        ],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "CLIENT", schema = Client::class),
            DiscriminatorMapping(value = "ORGANISATION", schema = Organisation::class),
            DiscriminatorMapping(value = "BLOCK_TREE", schema = BlockTree::class),
        ],
    )
    val entity: Referenceable? = null,
    val warning: BlockReferenceWarning? = null,
)

