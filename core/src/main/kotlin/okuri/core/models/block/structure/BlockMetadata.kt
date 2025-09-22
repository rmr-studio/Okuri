package okuri.core.models.block.structure

import java.io.Serializable
import java.util.*

data class BlockMetadata(
    val id: UUID,
    val name: String
) : Serializable