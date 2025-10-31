package okuri.core.models.block.tree

import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Referenceable


data class BlockTree(
    override val type: EntityType = EntityType.BLOCK_TREE,
    @field:Schema(
        oneOf = [ContentNode::class, ReferenceNode::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "entity_reference", schema = EntityReference::class),
            DiscriminatorMapping(value = "block_reference", schema = BlockTreeReference::class),
        ]
    )
    val root: Node,
) : Referenceable



