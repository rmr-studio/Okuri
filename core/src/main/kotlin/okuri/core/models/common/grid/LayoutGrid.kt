package okuri.core.models.common.grid

data class LayoutGrid(
    val layout: GridItem,
    val items: List<GridItem> = emptyList(),
)
