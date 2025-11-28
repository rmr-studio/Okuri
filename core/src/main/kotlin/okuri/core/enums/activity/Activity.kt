package okuri.core.enums.activity

import io.swagger.v3.oas.annotations.media.Schema

@Schema(
    name = "Activity",
    description = "Enumeration of possible activities within the system.",
    enumAsRef = true,
)
enum class Activity {
    LINE_ITEM,
    CLIENT,
    ORGANISATION,
    ORGANISATION_MEMBER_INVITE,
    ORGANISATION_MEMBER,
    INVOICE,
    BLOCK,
    BLOCK_TYPE,
    BLOCK_OPERATION,
    COMPANY,
    REPORT,
    TEMPLATE
}

