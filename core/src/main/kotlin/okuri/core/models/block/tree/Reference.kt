package okuri.core.models.block.tree

import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.node.ReferenceType
import okuri.core.models.block.Reference


@Schema(hidden = true)
sealed interface ReferencePayload {
    val type: ReferenceType
}

data class EntityReference(
    override val type: ReferenceType = ReferenceType.ENTITY,
    val reference: List<Reference>
) : ReferencePayload

data class BlockTreeReference(
    override val type: ReferenceType = ReferenceType.BLOCK,
    val reference: Reference
) : ReferencePayload