package okuri.core.enums.block

import com.fasterxml.jackson.annotation.JsonValue

enum class ReferenceType(@get:JsonValue val type: String) {
    BLOCK("block_reference"),
    ENTITY("entity_reference"),
}