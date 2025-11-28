package okuri.core.models.block.operation

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.DiscriminatorMapping
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.request.BlockOperationType
import okuri.core.models.block.tree.*
import java.util.*

@JsonTypeName("ADD_BLOCK")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class AddBlockOperation(
    override val type: BlockOperationType = BlockOperationType.ADD_BLOCK,
    // Temporary ID for the new block for local frontend referencing.. Will be replaced by the server with a permanent ID.
    override val blockId: UUID,
    @field:Schema(
        oneOf = [ContentNode::class, ReferenceNode::class],
        discriminatorProperty = "type",
        discriminatorMapping = [
            DiscriminatorMapping(value = "entity_reference", schema = EntityReference::class),
            DiscriminatorMapping(value = "block_reference", schema = BlockTreeReference::class),
        ]
    )
    val block: Node,
    val parentId: UUID? = null,
    // Only applicable to List nodes
    val index: Int? = null
) : BlockOperation