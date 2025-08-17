package okare.core.enums.util

enum class OperationType {
    CREATE,
    UPDATE,
    DELETE,
    READ,
    ARCHIVE,
    RESTORE;

    companion object {
        fun fromString(value: String): OperationType? {
            return entries.find { it.name.equals(value, ignoreCase = true) }
        }
    }
}