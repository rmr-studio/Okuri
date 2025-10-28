package okuri.core.models.common.grid

data class LayoutGrid(
    val layout: GridRect = GridRect(0, 0, 8, 12, 0),
    val items: List<GridItem> = emptyList(),
)
