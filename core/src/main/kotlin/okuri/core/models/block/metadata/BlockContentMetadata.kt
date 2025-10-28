package okuri.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockMetadataType
import okuri.core.models.common.json.JsonObject

@JsonTypeName("content")
@Schema(requiredProperties = ["kind", "meta"])
data class BlockContentMetadata(
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    var data: JsonObject = emptyMap(),
    override val kind: BlockMetadataType = BlockMetadataType.CONTENT,
    override val meta: BlockMeta = BlockMeta()
) : Metadata