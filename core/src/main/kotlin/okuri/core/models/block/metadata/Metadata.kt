package okuri.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeInfo
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockMetadataType

@Schema(
    oneOf = [
        BlockContentMetadata::class,
        EntityReferenceMetadata::class,
        BlockReferenceMetadata::class
    ],
    discriminatorProperty = "kind",
    discriminatorMapping = [
        DiscriminatorMapping(value = "content", schema = BlockContentMetadata::class),
        DiscriminatorMapping(value = "entity_reference", schema = EntityReferenceMetadata::class),
        DiscriminatorMapping(value = "block_reference", schema = BlockReferenceMetadata::class),
    ]
)
@JsonTypeInfo(
    use = JsonTypeInfo.Id.NAME,
    include = JsonTypeInfo.As.PROPERTY,
    property = "kind"
)


sealed interface Metadata {
    val kind: BlockMetadataType
    val meta: BlockMeta
}