package okuri.core.models.common.grid

data class LayoutGrid(
    val cols: Int,
    val rowHeight: Int,
    val width: Int,
    val height: Int,
    val items: List<GridItem> = emptyList(),
)