package okuri.core.service.util.factory.block

import okuri.core.enums.core.ComponentType
import okuri.core.models.block.display.*
import okuri.core.models.block.validation.BlockFormStructure
import okuri.core.models.common.Condition
import okuri.core.models.common.Op
import okuri.core.models.common.Operand
import okuri.core.models.common.grid.GridRect
import okuri.core.models.common.grid.LayoutGrid
import okuri.core.models.common.theme.ThemeTokens

/**
 * Factory for mock BlockRenderStructure (and wrappers) used in unit tests.
 * - Provides ready-made displays (contact card, table, nested slots, refs).
 * - Offers small helpers to assemble custom structures quickly.
 *
 * Typical use:
 *   val render = BlockRenderFixtures.contactWithAccountSummary()
 *   val display = BlockRenderFixtures.display(render) // wraps with empty form
 */
object BlockDisplayFactory {

    // ---------- Common Helpers ----------

    fun dataBinding(prop: String, path: String): BlockBinding =
        BlockBinding(prop = prop, source = BindingSource.DataPath(path))

    fun conditionExists(path: String): Condition =
        Condition(op = Op.EXISTS, left = Operand.Path(path))

    fun theme(
        variant: String? = null,
        colorRole: String? = null,
        tone: String? = null
    ) = ThemeTokens(variant = variant, colorRole = colorRole, tone = tone)

    /**
     * Wrap a render structure with an empty BlockFormStructure.
     * Useful when you need a full BlockDisplay in tests.
     */
    fun display(render: BlockRenderStructure): BlockDisplay =
        BlockDisplay(
            form = BlockFormStructure(fields = emptyMap()),
            render = render
        )

    // ---------- Ready-made Fixtures ----------

    /**
     * Contact card bound to name & email, plus a linked account summary via RefSlot "account".
     * - c_card @ (0,0,6,6)
     * - visible if $.data/name exists
     */
    fun contactWithAccountSummary(
        accountSlot: String = "account"
    ): BlockRenderStructure {
        val components = mapOf(
            "c_card" to BlockComponentNode(
                id = "c_card",
                type = ComponentType.CONTACT_CARD,
                props = mapOf("avatarShape" to "circle"),
                bindings = listOf(
                    dataBinding("title", "$.data/name"),
                    dataBinding("email", "$.data/email"),
                ),
                visible = conditionExists("$.data/name")
            )
        )
        return BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(
                layout = GridRect(
                    x = 0,
                    y = 0,
                    width = 12,
                    height = 12,
                    locked = false,
                    margin = null
                ),
                items = listOf(
                    GridRect(
                        x = 0,
                        y = 0,
                        width = 6,
                        height = 6,
                        locked = false,
                        margin = null
                    )
                )
            ),
            components = components
        )
    }


}
