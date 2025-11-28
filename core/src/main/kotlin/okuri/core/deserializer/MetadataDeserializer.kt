package okuri.core.deserializer

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import okuri.core.enums.block.structure.BlockMetadataType
import okuri.core.models.block.metadata.BlockContentMetadata
import okuri.core.models.block.metadata.BlockReferenceMetadata
import okuri.core.models.block.metadata.EntityReferenceMetadata
import okuri.core.models.block.metadata.Metadata
import okuri.core.util.getEnumFromField

/**
 * Jackson deserializer for [Metadata].
 * Ensures all implementations of this sealed interface are properly deserialized.
 */
class MetadataDeserializer : JsonDeserializer<Metadata>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Metadata {
        val node = p.codec.readTree<JsonNode>(p)
        val metadataType = ctxt.getEnumFromField<BlockMetadataType>(
            node,
            "type",
            Metadata::class.java
        )

        return when (metadataType) {
            BlockMetadataType.CONTENT -> p.codec.treeToValue(node, BlockContentMetadata::class.java)
            BlockMetadataType.ENTITY_REFERENCE -> p.codec.treeToValue(node, EntityReferenceMetadata::class.java)
            BlockMetadataType.BLOCK_REFERENCE -> p.codec.treeToValue(node, BlockReferenceMetadata::class.java)
        }
    }
}
