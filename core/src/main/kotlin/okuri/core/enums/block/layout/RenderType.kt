package okuri.core.enums.block.layout

import com.fasterxml.jackson.annotation.JsonValue

enum class RenderType(@get:JsonValue val type: String) {
    LIST("list"),
    COMPONENT("component"),
    CONTAINER("container");
}