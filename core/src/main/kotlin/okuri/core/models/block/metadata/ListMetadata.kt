package okuri.core.models.block.metadata

import okuri.core.enums.block.node.ListFilterLogicType
import okuri.core.enums.block.structure.BlockListOrderingMode

interface ListMetadata<T> {
    val order: OrderingConfig
    val display: ListDisplayConfig
    val allowDuplicates: Boolean
    val allowedTypes: List<T>?
}

data class OrderingConfig(
    val mode: BlockListOrderingMode = BlockListOrderingMode.MANUAL,
    // Used when mode=SORTED
    val sort: SortSpec? = null,
    val filters: List<FilterSpec>? = null,
    val filterLogic: ListFilterLogicType? = null,
)


data class ListDisplayConfig(
    val itemSpacing: Int = 8,
    val showDragHandles: Boolean = true, // Auto-false when mode=SORTED
    val emptyMessage: String = "No items",
    val paging: PagingSpec? = null,
)