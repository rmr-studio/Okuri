package okuri.core.models.block

import okuri.core.models.block.tree.BlockTree
import okuri.core.models.block.tree.BlockTreeLayout

data class BlockEnvironment(
    val layout: BlockTreeLayout,
    val trees: List<BlockTree>,
)