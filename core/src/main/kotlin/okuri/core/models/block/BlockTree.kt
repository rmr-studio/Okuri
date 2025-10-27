package okuri.core.models.block

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.core.EntityType

@JsonTypeName("block_tree")
@Schema(requiredProperties = ["kind", "root"])
data class BlockTree(
    override val kind: EntityType = EntityType.BLOCK_TREE,
    val root: Node,
) : Referenceable

sealed interface Node {
    val block: Block
    val warnings: List<String>
}

data class ContentNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // All child blocks, given a block and its associated block type supports nesting
    val children: Map<String, List<Node>>? = null,
) : Node

sealed interface ReferencePayload
data class EntityReference(val reference: List<Reference>) : ReferencePayload
data class BlockTreeReference(val reference: Reference) : ReferencePayload

data class ReferenceNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    val reference: ReferencePayload
) : Node
