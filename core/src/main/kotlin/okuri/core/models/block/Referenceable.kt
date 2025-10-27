package okuri.core.models.block

import com.fasterxml.jackson.annotation.JsonTypeInfo
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.core.EntityType
import okuri.core.models.client.Client
import okuri.core.models.organisation.Organisation


@Schema(
    oneOf = [
        Client::class,
        Organisation::class,
        BlockTree::class
    ],
    discriminatorProperty = "kind",
    discriminatorMapping = [
        DiscriminatorMapping(value = "client", schema = Client::class),
        DiscriminatorMapping(value = "organisation", schema = Organisation::class),
        DiscriminatorMapping(value = "block_tree", schema = BlockTree::class),
    ]
)
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "kind"
)
interface Referenceable {
    val kind: EntityType
}