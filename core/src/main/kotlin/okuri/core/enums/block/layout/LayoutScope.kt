package okuri.core.enums.block.layout

/**
 * Defines the scope/ownership of a block layout
 */
enum class LayoutScope {
    /**
     * Default layout for the entire organization.
     * Used as fallback when no user-specific layout exists.
     */
    ORGANIZATION,

    /**
     * User-specific personalized layout.
     * Overrides organization default for that specific user.
     */
    USER,

    /**
     * Shared team layout.
     * Can be applied to specific teams/groups.
     */
    TEAM
}