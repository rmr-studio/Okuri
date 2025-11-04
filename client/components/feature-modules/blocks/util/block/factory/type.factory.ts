import { nowIso, uniqueId } from "@/lib/util/utils";
import {
    BlockComponentNode,
    BlockDisplay,
    BlockSchema,
    BlockType,
    BlockTypeNesting,
    GridRect,
} from "../../../interface/block.interface";

export const DEFAULT_GRID_LAYOUT: GridRect = {
    x: 0,
    y: 0,
    width: 12,
    height: 4,
    locked: false,
};

const createBaseDisplay = (component: BlockComponentNode): BlockDisplay => ({
    form: { fields: {} },
    render: {
        version: 1,
        layoutGrid: {
            layout: DEFAULT_GRID_LAYOUT,
            items: [
                {
                    id: component.id,
                    sm: { x: 0, y: 0, width: 12, height: 8, locked: false },
                    lg: { x: 0, y: 0, width: 12, height: 8, locked: false },
                },
            ],
        },
        components: {
            [component.id]: component,
        },
    },
});

const createBaseBlockType = ({
    key,
    name,
    description,
    organisationId,
    schema,
    display,
    nesting,
}: {
    key: string;
    name: string;
    description?: string;
    organisationId?: string;
    schema: BlockSchema;
    display: BlockDisplay;
    nesting?: BlockTypeNesting | null;
}): BlockType => ({
    id: uniqueId(`type-${key}`),
    key,
    version: 1,
    name,
    description,
    organisationId,
    archived: false,
    strictness: "SOFT",
    system: false,
    schema,
    display,
    nesting: nesting ?? undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
});

export const ALL_BLOCK_COMPONENT_TYPES: NonNullable<BlockType["nesting"]>["allowedTypes"] = [
    "CONTACT_CARD",
    "LAYOUT_CONTAINER",
    "ADDRESS_CARD",
    "LINE_ITEM",
    "TABLE",
    "TEXT",
    "IMAGE",
    "BUTTON",
    "ATTACHMENT",
];

const layoutContainerComponent: BlockComponentNode = {
    id: "layout",
    type: "LAYOUT_CONTAINER",
    props: {
        variant: "card",
        padded: true,
    },
    bindings: [
        {
            prop: "title",
            source: { type: "DataPath", path: "$.data/title" },
        },
        {
            prop: "description",
            source: { type: "DataPath", path: "$.data/description" },
        },
    ],
    slots: {
        main: ["*"], // ← Wildcard slot for dynamic child blocks
    },
    slotLayout: {
        main: {
            layout: DEFAULT_GRID_LAYOUT,
            items: [],
        },
    },
    fetchPolicy: "LAZY",
};

const layoutContainerSchema: BlockSchema = {
    name: "LayoutContainer",
    type: "OBJECT",
    required: true,
    properties: {
        title: {
            name: "Title",
            type: "STRING",
            required: false,
        },
        description: {
            name: "Description",
            type: "STRING",
            required: false,
        },
    },
};

export const createLayoutContainerBlockType = (organisationId?: string): BlockType =>
    createBaseBlockType({
        key: "layout_container",
        name: "Layout Container",
        description: "Hosts nested blocks inside a grid-aware surface.",
        organisationId,
        schema: layoutContainerSchema,
        display: createBaseDisplay(layoutContainerComponent),
        nesting: {
            max: undefined,
            allowedTypes: ALL_BLOCK_COMPONENT_TYPES,
        },
    });

const listComponent: BlockComponentNode = {
    id: "list",
    type: "LINE_ITEM",
    props: {
        title: "List",
        emptyMessage: "Add an item",
        itemComponent: "ADDRESS_CARD",
    },
    bindings: [
        { prop: "title", source: { type: "DataPath", path: "$.data/title" } },
        { prop: "description", source: { type: "DataPath", path: "$.data/description" } },
        { prop: "emptyMessage", source: { type: "DataPath", path: "$.data/emptyMessage" } },
    ],
    fetchPolicy: "LAZY",
};

const listSchema: BlockSchema = {
    name: "BlockList",
    type: "OBJECT",
    required: true,
    properties: {
        title: {
            name: "Title",
            type: "STRING",
            required: false,
        },
        description: {
            name: "Description",
            type: "STRING",
            required: false,
        },
        emptyMessage: {
            name: "Empty message",
            type: "STRING",
            required: false,
        },
    },
};

export const createBlockListBlockType = (organisationId?: string): BlockType =>
    createBaseBlockType({
        key: "block_list",
        name: "Block List",
        description: "Renders a homogeneous list of owned child blocks.",
        organisationId,
        schema: listSchema,
        display: createBaseDisplay(listComponent),
        nesting: {
            max: 100,
            allowedTypes: ALL_BLOCK_COMPONENT_TYPES,
        },
    });

const blockReferenceComponent: BlockComponentNode = {
    id: "reference",
    type: "TEXT",
    props: {
        text: "Referenced block placeholder",
        variant: "muted",
    },
    bindings: [
        {
            prop: "text",
            source: { type: "DataPath", path: "$.data/placeholder" },
        },
    ],
    fetchPolicy: "LAZY",
};

const blockReferenceSchema: BlockSchema = {
    name: "BlockReference",
    type: "OBJECT",
    required: true,
    properties: {
        placeholder: {
            name: "Placeholder",
            type: "STRING",
            required: false,
        },
    },
};

export const createBlockReferenceType = (organisationId?: string): BlockType =>
    createBaseBlockType({
        key: "block_reference",
        name: "Embedded Block Reference",
        description: "Embeds the contents of another block tree.",
        organisationId,
        schema: blockReferenceSchema,
        display: createBaseDisplay(blockReferenceComponent),
        nesting: null,
    });

const entityReferenceComponent: BlockComponentNode = {
    id: "entities",
    type: "TEXT",
    props: {
        text: "Entity reference list placeholder",
        variant: "muted",
    },
    bindings: [
        {
            prop: "text",
            source: { type: "DataPath", path: "$.data/emptyMessage" },
        },
    ],
    fetchPolicy: "LAZY",
};

const entityReferenceSchema: BlockSchema = {
    name: "EntityReferenceList",
    type: "OBJECT",
    required: true,
    properties: {
        title: {
            name: "Title",
            type: "STRING",
            required: false,
        },
        emptyMessage: {
            name: "Empty message",
            type: "STRING",
            required: false,
        },
    },
};

export const createEntityReferenceListType = (organisationId?: string): BlockType =>
    createBaseBlockType({
        key: "entity_reference_list",
        name: "Entity Reference List",
        description: "References a list of external entities.",
        organisationId,
        schema: entityReferenceSchema,
        display: createBaseDisplay(entityReferenceComponent),
        nesting: null,
    });

const contentBlockListComponent: BlockComponentNode = {
    id: "contentList",
    type: "LAYOUT_CONTAINER",
    props: {
        variant: "list",
        padded: false,
    },
    bindings: [
        {
            prop: "title",
            source: { type: "DataPath", path: "$.data/title" },
        },
        {
            prop: "description",
            source: { type: "DataPath", path: "$.data/description" },
        },
    ],
    slots: {
        items: ["*"], // Wildcard slot for dynamic list items
    },
    fetchPolicy: "LAZY",
};

const contentBlockListSchema: BlockSchema = {
    name: "ContentBlockList",
    type: "OBJECT",
    required: true,
    properties: {
        title: {
            name: "Title",
            type: "STRING",
            required: false,
        },
        description: {
            name: "Description",
            type: "STRING",
            required: false,
        },
    },
};

export const createContentBlockListType = (organisationId?: string): BlockType =>
    createBaseBlockType({
        key: "content_block_list",
        name: "Content Block List",
        description: "Ordered list of content blocks with configurable ordering.",
        organisationId,
        schema: contentBlockListSchema,
        display: createBaseDisplay(contentBlockListComponent),
        nesting: {
            max: undefined,
            allowedTypes: ALL_BLOCK_COMPONENT_TYPES, // Default, overridden by listConfig
        },
    });
