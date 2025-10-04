package okuri.core.models.block.request

import okuri.core.models.block.Block
import okuri.core.models.block.BlockReference

data class BlockTree(
    val maxDepth: Int = 1,
    val expandRefs: Boolean = false,
    val root: BlockNode,
)

data class BlockNode(
    val block: Block,
    /** key = logical edge (e.g., "contacts", "lineItems") -> many children */
    val children: Map<String, List<BlockNode>> = emptyMap(),
    val references: Map<String, List<BlockReference<*>>> = emptyMap(),
    /** warnings such as missing targets, cycle stubs, etc. */
    val warnings: List<String> = emptyList()
)