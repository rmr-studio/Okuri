import { BlockRenderStructure } from "@/components/feature-modules/blocks/interface/block.interface";

export const display: BlockRenderStructure = {
    version: 1,
    layoutGrid: {
        cols: 12,
        rowHeight: 40,
        width: 1200,
        height: 800,
        items: [
            {
                id: "c_card",
                sm: { x: 0, y: 0, w: 12, h: 6 },
                lg: { x: 0, y: 0, w: 6, h: 6 },
            },
            {
                id: "addr_list",
                sm: { x: 0, y: 6, w: 12, h: 6 },
                lg: { x: 6, y: 0, w: 6, h: 6 },
            },
        ],
    },
    components: {
        c_card: {
            id: "c_card",
            type: "CONTACT_CARD",
            props: { avatarShape: "circle" }, // free-form props
            bindings: [
                { prop: "title", source: { type: "DataPath", path: "$.data/name" } },
                { prop: "email", source: { type: "DataPath", path: "$.data/email" } },
                {
                    prop: "account",
                    source: {
                        type: "RefSlot",
                        slot: "account",
                        presentation: "SUMMARY",
                        fields: ["name", "domain"],
                    },
                },
            ],
            visible: { op: "EXISTS", left: { kind: "Path", path: "$.data/name" } },
            fetchPolicy: "LAZY",
        },
        addr_list: {
            id: "addr_list",
            type: "LINE_ITEM", // in registry: render as InlineOwnedList
            props: { itemComponent: "ADDRESS_CARD" },
            bindings: [
                {
                    prop: "items",
                    source: {
                        type: "RefSlot",
                        slot: "addresses",
                        presentation: "INLINE",
                        expandDepth: 1,
                    },
                },
            ],
            fetchPolicy: "LAZY",
        },
    },
    theme: { variant: "emphasis", tone: "auto" },
};
