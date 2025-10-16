package okuri.core.models.common.grid

data class LayoutGrid(
    val cols: Int? = null,
    val rowHeight: Int? = null,
    val width: Int? = null,
    val height: Int? = null,
    val items: List<GridItem> = emptyList(),
)