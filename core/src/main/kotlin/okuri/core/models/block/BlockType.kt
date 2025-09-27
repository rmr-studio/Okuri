package okuri.core.models.block

import okuri.core.enums.block.BlockTypeScope
import okuri.core.enums.block.BlockValidationScope
import okuri.core.models.block.structure.BlockDisplay
import okuri.core.models.block.structure.BlockSchema
import java.time.ZonedDateTime
import java.util.*

data class BlockType(
    val id: UUID,
    val key: String,
    val version: Int,
    val name: String,
    val description: String?,
    val organisationId: UUID?,
    val scope: BlockTypeScope,
    val validationMode: BlockValidationScope,
    val system: Boolean,
    val schema: BlockSchema,
    val display: BlockDisplay,
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?,
    val createdBy: UUID?,
    val updatedBy: UUID?,
)

