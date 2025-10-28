package okuri.core.models.block.metadata

import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockMetadataType

@Schema(hidden = true)
sealed interface Metadata {
    val type: BlockMetadataType
    val meta: BlockMeta
}
