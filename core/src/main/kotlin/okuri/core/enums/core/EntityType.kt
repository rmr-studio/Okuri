package okuri.core.enums.core

import com.fasterxml.jackson.annotation.JsonValue

enum class EntityType(@get:JsonValue val type: String) {
    LINE_ITEM("line_item"),
    CLIENT("client"),
    COMPANY("company"),
    INVOICE("invoice"),
    BLOCK_TREE("block_tree"),
    REPORT("report"),
    DOCUMENT("document"),
    PROJECT("project"),
    ORGANISATION("organisation"),
    TASK("task"),
    BLOCK_TYPE("block_type"),
    BLOCK("block"),
    USER("user"),
}
