package okuri.core.enums.block.node

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class NodeType(@get:JsonValue val type: String) {
    REFERENCE("reference_node"),
    CONTENT("content_node");

    companion object {
        @JsonCreator
        @JvmStatic
        fun from(value: String): NodeType =
            entries.firstOrNull { it.type.equals(value, ignoreCase = true) }
                ?: error("Unknown NodeType: $value")
    }
}