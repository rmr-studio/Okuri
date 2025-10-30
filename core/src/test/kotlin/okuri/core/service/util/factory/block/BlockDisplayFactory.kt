package okuri.core.service.util.factory.block

import okuri.core.enums.core.ComponentType
import okuri.core.models.block.display.*
import okuri.core.models.block.validation.BlockFormStructure
import okuri.core.models.common.Condition
import okuri.core.models.common.Op
import okuri.core.models.common.Operand
import okuri.core.models.common.grid.GridItem
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

    fun refBinding(
        prop: String,
        slot: String,
        presentation: RefPresentation = RefPresentation.SUMMARY,
        fields: List<String>? = null,
        expandDepth: Int? = null
    ): BlockBinding = BlockBinding(
        prop = prop,
        source = BindingSource.RefSlot(
            slot = slot,
            presentation = presentation,
            fields = fields,
            expandDepth = expandDepth
        )
    )

    fun conditionExists(path: String): Condition =
        Condition(op = Op.EXISTS, left = Operand.Path(path))

    fun lg(x: Int, y: Int, w: Int, h: Int, locked: Boolean = false) =
        GridRect(x = x, y = y, width = w, height = h, locked = locked, margin = null)

    fun item(id: String, rect: GridRect, sm: GridRect? = null) =
        GridItem(id = id, lg = rect, sm = sm)

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
                    refBinding(
                        "account",
                        accountSlot,
                        presentation = RefPresentation.SUMMARY,
                        fields = listOf("name", "domain")
                    )
                ),
                visible = conditionExists("$.data/name")
            )
        )
        return BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(items = listOf(item("c_card", lg(0, 0, 6, 6)))),
            components = components
        )
    }

    /**
     * Addresses inline: a LIST container that expects owned BLOCK refs in slot "addresses", rendered inline.
     */
    fun addressesInlineList(
        slot: String = "addresses"
    ): BlockRenderStructure {
        val components = mapOf(
            "addr_list" to BlockComponentNode(
                id = "addr_list",
                type = ComponentType.LINE_ITEM, // or ComponentType.TABLE / a custom LIST component in your registry
                props = mapOf("itemComponent" to "ADDRESS_CARD"),
                bindings = listOf(
                    refBinding("items", slot, presentation = RefPresentation.INLINE, expandDepth = 1)
                )
            )
        )
        return BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(items = listOf(item("addr_list", lg(0, 0, 12, 6)))),
            components = components
        )
    }

    /**
     * Table bound to an array at $.data/lineItems, with simple columns.
     */
    fun invoiceTableFromData(
        dataPath: String = "$.data/lineItems"
    ): BlockRenderStructure {
        val components = mapOf(
            "lines" to BlockComponentNode(
                id = "lines",
                type = ComponentType.TABLE,
                props = mapOf(
                    "columns" to listOf(
                        mapOf("key" to "sku", "label" to "SKU"),
                        mapOf("key" to "qty", "label" to "Qty"),
                        mapOf("key" to "price", "label" to "Price"),
                        mapOf("key" to "total", "label" to "Total")
                    )
                ),
                bindings = listOf(
                    dataBinding("rows", dataPath)
                )
            )
        )
        return BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(items = listOf(item("lines", lg(0, 0, 12, 8)))),
            components = components
        )
    }

    /**
     * Two-tile layoutGrid: a contact card and an address list side-by-side.
     */
    fun contactAndAddresses(
        accountSlot: String = "account",
        addressesSlot: String = "addresses"
    ): BlockRenderStructure {
        val comps = mutableMapOf<String, BlockComponentNode>()

        comps["c_card"] = BlockComponentNode(
            id = "c_card",
            type = ComponentType.CONTACT_CARD,
            props = mapOf("avatarShape" to "circle"),
            bindings = listOf(
                dataBinding("title", "$.data/name"),
                dataBinding("email", "$.data/email"),
                refBinding(
                    "account",
                    accountSlot,
                    presentation = RefPresentation.SUMMARY,
                    fields = listOf("name", "domain")
                )
            ),
            visible = conditionExists("$.data/name")
        )

        comps["addr_list"] = BlockComponentNode(
            id = "addr_list",
            type = ComponentType.LINE_ITEM, // replace with your LIST component type if different
            props = mapOf("itemComponent" to "ADDRESS_CARD"),
            bindings = listOf(
                refBinding("items", addressesSlot, presentation = RefPresentation.INLINE, expandDepth = 1)
            )
        )

        return BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(
                items = listOf(
                    item("c_card", lg(0, 0, 6, 6)),
                    item("addr_list", lg(6, 0, 6, 6))
                )
            ),
            components = comps
        )
    }

    /**
     * Nested slots example:
     * - A CARD container with header/body slots.
     * - Header contains TEXT with conditional visibility.
     * - Body contains TABLE bound to $.data/lineItems.
     */
    fun nestedCardWithSlots(): BlockRenderStructure {
        val comps = mutableMapOf<String, BlockComponentNode>()

        comps["header_text"] = BlockComponentNode(
            id = "header_text",
            type = ComponentType.TEXT,
            props = mapOf("variant" to "h3"),
            bindings = listOf(dataBinding("text", "$.data/title")),
            visible = conditionExists("$.data/title")
        )

        comps["lines"] = BlockComponentNode(
            id = "lines",
            type = ComponentType.TABLE,
            props = mapOf(
                "columns" to listOf(
                    mapOf("key" to "name", "label" to "Name"),
                    mapOf("key" to "qty", "label" to "Qty"),
                    mapOf("key" to "price", "label" to "Price")
                )
            ),
            bindings = listOf(dataBinding("rows", "$.data/lineItems"))
        )

        comps["card"] = BlockComponentNode(
            id = "card",
            type = ComponentType.ATTACHMENT, // use your CARD type if you have one; ATTACHMENT as placeholder
            props = mapOf("elevated" to true),
            slots = mapOf(
                "header" to listOf("header_text"),
                "body" to listOf("lines")
            )
        )

        return BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(items = listOf(item("card", lg(0, 0, 12, 10)))),
            components = comps,
            theme = theme(variant = "emphasis")
        )
    }

    // ---------- Invalid Fixtures (for linter tests) ----------

    /** layoutGrid references a component id that does not exist. */
    fun invalid_missingComponentInLayout(): BlockRenderStructure =
        BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(items = listOf(item("ghost", lg(0, 0, 6, 4)))),
            components = mapOf(
                "real" to BlockComponentNode(
                    id = "real",
                    type = ComponentType.TEXT,
                    props = mapOf("text" to "Hello")
                )
            )
        )

    /** Component slot references a child id that does not exist. */
    fun invalid_unknownChildInSlot(): BlockRenderStructure =
        BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(items = listOf(item("parent", lg(0, 0, 12, 4)))),
            components = mapOf(
                "parent" to BlockComponentNode(
                    id = "parent",
                    type = ComponentType.ATTACHMENT, // placeholder container
                    slots = mapOf(
                        "header" to listOf("missing_child")
                    )
                )
            )
        )

    /** Bad binding path (doesn't start with $.data/), useful to ensure linter warns. */
    fun invalid_badDataPath(): BlockRenderStructure =
        BlockRenderStructure(
            version = 1,
            layoutGrid = LayoutGrid(items = listOf(item("t", lg(0, 0, 6, 3)))),
            components = mapOf(
                "t" to BlockComponentNode(
                    id = "t",
                    type = ComponentType.TEXT,
                    bindings = listOf(
                        dataBinding("text", "name") // intentionally missing "$.data/"
                    )
                )
            )
        )
}
