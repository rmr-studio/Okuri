package okuri.core.models.block.operation

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.request.BlockOperationType
import okuri.core.models.block.tree.*
import java.util.*

@JsonTypeName("UPDATE_BLOCK")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class UpdateBlockOperation(
    override val type: BlockOperationType = BlockOperationType.UPDATE_BLOCK,
    override val blockId: UUID,

    @field:Schema(
        oneOf = [ContentNode::class, ReferenceNode::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "entity_reference", schema = EntityReference::class),
            DiscriminatorMapping(value = "block_reference", schema = BlockTreeReference::class),
        ]
    )
    val updatedContent: Node
) : BlockOperation