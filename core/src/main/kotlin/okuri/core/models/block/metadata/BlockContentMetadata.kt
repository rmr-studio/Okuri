package okuri.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockMetadataType
import okuri.core.models.common.json.JsonObject

@JsonTypeName("block_content")
data class BlockContentMetadata(
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    var data: JsonObject = emptyMap(),
    override val type: BlockMetadataType = BlockMetadataType.CONTENT,
    override val meta: BlockMeta = BlockMeta(),
    val listConfig: BlockListConfiguration? = null
) : Metadata

data class BlockListConfiguration(
    override val allowedTypes: List<String>? = null,
    override val allowDuplicates: Boolean = false,
    override val display: ListDisplayConfig = ListDisplayConfig(),
    override val order: OrderingConfig = OrderingConfig()
) : ListMetadata<String>