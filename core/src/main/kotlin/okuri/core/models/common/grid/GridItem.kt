package okuri.core.models.common.grid

data class GridItem(
    val id: String,
    val sm: GridRect? = null,
    val md: GridRect? = null,
    val lg: GridRect,
)