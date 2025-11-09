package okuri.core.models.block.layout

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonInclude
import okuri.core.enums.block.layout.RenderType
import okuri.core.enums.block.node.NodeType

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
data class RenderContent(
    val id: String,
    val key: String,
    val renderType: RenderType,
    val blockType: NodeType
)