package okuri.core.models.block.structure

import okuri.core.enums.core.ComponentType

data class BlockTypeNesting(
    val max: Int?,
    val allowedTypes: List<ComponentType>,
)