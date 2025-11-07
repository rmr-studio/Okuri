package okuri.core.models.block.layout

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonInclude
import okuri.core.enums.block.layout.RenderType
import okuri.core.enums.block.node.NodeType
import java.util.*

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
data class RenderContent(
    val id: UUID,
    val key: String,
    val renderType: RenderType,
    val blockType: NodeType
)