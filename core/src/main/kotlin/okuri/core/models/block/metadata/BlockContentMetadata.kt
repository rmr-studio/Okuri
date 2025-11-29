package okuri.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.structure.BlockMetadataType
import okuri.core.models.common.json.JsonObject

@JsonTypeName("content")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class BlockContentMetadata(
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    var data: JsonObject = emptyMap(),
    override val type: BlockMetadataType = BlockMetadataType.CONTENT,
    override val meta: BlockMeta = BlockMeta(),
    override val deletable: Boolean = true,
    val listConfig: BlockListConfiguration? = null
) : Metadata

data class BlockListConfiguration(
    override val listType: List<String>? = null,
    override val allowDuplicates: Boolean = false,
    override val display: ListDisplayConfig = ListDisplayConfig(),
    override val config: ListConfig = ListConfig()
) : ListMetadata<List<String>>