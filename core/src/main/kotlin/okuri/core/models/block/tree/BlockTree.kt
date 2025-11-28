package okuri.core.models.block.tree

import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Referenceable


@JsonDeserialize(using = JsonDeserializer.None::class)
data class BlockTree(
    override val type: EntityType = EntityType.BLOCK_TREE,
    @field:Schema(
        oneOf = [ContentNode::class, ReferenceNode::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "CONTENT", schema = ContentNode::class),
            DiscriminatorMapping(value = "REFERENCE", schema = ReferenceNode::class),
        ]
    )
    val root: Node,
) : Referenceable



