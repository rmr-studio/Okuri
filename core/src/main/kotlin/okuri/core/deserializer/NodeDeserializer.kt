package okuri.core.deserializer

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import okuri.core.enums.block.node.NodeType
import okuri.core.models.block.tree.ContentNode
import okuri.core.models.block.tree.Node
import okuri.core.models.block.tree.ReferenceNode

class NodeDeserializer : JsonDeserializer<Node>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Node {
        val node = p.codec.readTree<JsonNode>(p)
        val typeValue = node.get("type")?.asText()

        val nodeType = NodeType.valueOf(typeValue ?: throw IllegalArgumentException("Missing type"))

        return when (nodeType) {
            NodeType.CONTENT -> p.codec.treeToValue(node, ContentNode::class.java)
            NodeType.REFERENCE -> p.codec.treeToValue(node, ReferenceNode::class.java)
        }
    }
}