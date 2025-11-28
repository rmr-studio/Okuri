package okuri.core.enums.core

import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    name = "EntityType",
    description = "Enumeration of possible entity types within the system.",
    enumAsRef = true,
)
enum class EntityType {
    LINE_ITEM,
    CLIENT,
    COMPANY,
    INVOICE,
    BLOCK_TREE,
    REPORT,
    DOCUMENT,
    PROJECT,
    ORGANISATION,
    TASK,
    BLOCK_TYPE,
    BLOCK,
    USER,
}
