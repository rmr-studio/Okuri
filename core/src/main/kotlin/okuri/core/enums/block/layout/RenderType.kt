package okuri.core.enums.block.layout

import com.fasterxml.jackson.annotation.JsonCreator
import com.fasterxml.jackson.annotation.JsonValue

enum class RenderType(@get:JsonValue val type: String) {
    LIST("list"),
    COMPONENT("component"),
    CONTAINER("container");

    companion object {
        @JsonCreator
        @JvmStatic
        fun from(value: String): RenderType =
            entries.firstOrNull { it.type.equals(value, ignoreCase = true) }
                ?: error("Unknown RenderType: $value")
    }
}