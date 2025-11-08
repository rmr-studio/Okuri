package okuri.core.models.common.grid

data class LayoutGrid(
    val layout: GridRect,
    val items: List<GridRect> = emptyList(),
)
