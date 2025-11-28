package okuri.core.deserializer

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import okuri.core.enums.core.EntityType
import okuri.core.models.block.Referenceable
import okuri.core.models.block.tree.BlockTree
import okuri.core.models.client.Client
import okuri.core.models.organisation.Organisation

/**
 * Jackson deserializer for [Referenceable].
 * Ensures all implementations of this interface are properly deserialized.
 */
class ReferenceableDeserializer : JsonDeserializer<Referenceable>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Referenceable {
        val node = p.codec.readTree<JsonNode>(p)
        val type = node.get("type")?.asText() ?: throw IllegalArgumentException("Missing 'type' property")

        val entityType = EntityType.valueOf(type)

        return when (entityType) {
            EntityType.CLIENT -> p.codec.treeToValue(node, Client::class.java)
            EntityType.ORGANISATION -> p.codec.treeToValue(node, Organisation::class.java)
            EntityType.BLOCK_TREE -> p.codec.treeToValue(node, BlockTree::class.java)
            else -> throw IllegalArgumentException("Unknown Referenceable type: $type")
        }
    }
}
