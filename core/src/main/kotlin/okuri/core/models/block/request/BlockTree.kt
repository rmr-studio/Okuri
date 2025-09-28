package okuri.core.models.block.request

import okuri.core.models.block.Block

data class BlockTree(
    val maxDepth: Int = 1,
    val expandRefs: Boolean = false,
    val root: BlockNode,
)

data class BlockNode(
    val block: Block,
    val children: Map<String, BlockNode> = mapOf(),
)