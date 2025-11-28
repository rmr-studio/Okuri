package okuri.core.deserializer

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import okuri.core.enums.block.request.BlockOperationType
import okuri.core.models.block.operation.*
import okuri.core.util.getEnumFromField

/**
 * Jackson deserializer for [BlockOperation].
 * Ensures all implementations of this sealed interface are properly deserialized.
 */
class BlockOperationDeserializer : JsonDeserializer<BlockOperation>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): BlockOperation {
        val operation = p.codec.readTree<JsonNode>(p)
        val operationType = ctxt.getEnumFromField<BlockOperationType>(
            operation,
            "type",
            BlockOperation::class.java
        )

        return when (operationType) {
            BlockOperationType.ADD_BLOCK -> p.codec.treeToValue(operation, AddBlockOperation::class.java)
            BlockOperationType.REMOVE_BLOCK -> p.codec.treeToValue(operation, RemoveBlockOperation::class.java)
            BlockOperationType.UPDATE_BLOCK -> p.codec.treeToValue(operation, UpdateBlockOperation::class.java)
            BlockOperationType.REORDER_BLOCK -> p.codec.treeToValue(operation, ReorderBlockOperation::class.java)
            BlockOperationType.MOVE_BLOCK -> p.codec.treeToValue(operation, MoveBlockOperation::class.java)
        }
    }
}