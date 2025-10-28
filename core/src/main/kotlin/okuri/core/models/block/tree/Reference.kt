package okuri.core.models.block.tree

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.ReferenceType
import okuri.core.models.block.Reference


@Schema(hidden = true)
sealed interface ReferencePayload {
    val type: ReferenceType
}

@JsonTypeName("entity_reference")
data class EntityReference(
    override val type: ReferenceType = ReferenceType.ENTITY,
    val reference: List<Reference>
) : ReferencePayload

@JsonTypeName("block_tree_reference")
data class BlockTreeReference(
    override val type: ReferenceType = ReferenceType.BLOCK,
    val reference: Reference
) : ReferencePayload