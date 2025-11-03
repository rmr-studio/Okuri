package okuri.core.models.block.tree

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.NodeType
import okuri.core.models.block.Block

@Schema(hidden = true)
sealed interface Node {
    val type: NodeType
    val block: Block
    val warnings: List<String>
}

@JsonTypeName("content_node")
data class ContentNode(
    override val type: NodeType = NodeType.CONTENT,
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // All child blocks, given a block and its associated block type supports nesting
    val children: List<Node>? = null,
) : Node


@JsonTypeName("reference_node")
data class ReferenceNode(
    override val type: NodeType = NodeType.REFERENCE,
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    @field:Schema(
        oneOf = [EntityReference::class, BlockTreeReference::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "entity_reference", schema = EntityReference::class),
            DiscriminatorMapping(value = "block_reference", schema = BlockTreeReference::class),
        ]
    )
    val reference: ReferencePayload
) : Node