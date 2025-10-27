package okuri.core.enums.block

import com.fasterxml.jackson.annotation.JsonProperty

enum class BlockMetadataType {
    @JsonProperty("content")
    CONTENT,

    @JsonProperty("block_reference")
    BLOCK_REFERENCE,

    @JsonProperty("entity_reference")
    ENTITY_REFERENCE
}