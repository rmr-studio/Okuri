package okuri.core.enums.block

import com.fasterxml.jackson.annotation.JsonValue

// ----- Discriminator enum with wire values -----
enum class BlockMetadataType(@get:JsonValue val def: String) {
    CONTENT("content"),
    ENTITY_REFERENCE("entity_reference"),
    BLOCK_REFERENCE("block_reference")
}
