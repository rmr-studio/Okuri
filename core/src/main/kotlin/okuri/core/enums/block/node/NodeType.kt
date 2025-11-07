package okuri.core.enums.block.node

import com.fasterxml.jackson.annotation.JsonValue

enum class NodeType(@get:JsonValue val type: String) {
    REFERENCE("reference_node"),
    CONTENT("content_node")
}