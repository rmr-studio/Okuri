package okuri.core.enums.block.node

import io.swagger.v3.oas.annotations.media.Schema

@Schema(enumAsRef = true)
enum class NodeType {
    REFERENCE,
    CONTENT,
    ERROR
}
