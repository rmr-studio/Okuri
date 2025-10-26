package okuri.core.models.block

data class BlockTree(
    val root: Node,
) : Referenceable<BlockTree> {
    // NO-OP for BlockTree
    override fun toReference(): BlockTree {
        return this
    }
}

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
data class EntityReference(val reference: List<Reference<*>>) : ReferencePayload
data class BlockTreeReference(val reference: Reference<BlockTree>) : ReferencePayload

data class ReferenceNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // Allow for lists of entities. But never a list of referenced blocks
    val reference: ReferencePayload
) : Node
