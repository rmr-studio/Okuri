package okuri.core.models.block

import java.io.Serializable
import java.util.*

data class BlockMetadata(
    val id: UUID,
    val name: String
) : Serializable