import { nowIso, uniqueId } from "@/lib/util/utils";
import {
    BlockComponentNode,
    BlockNode,
    BlockRenderStructure,
    BlockType,
    ReferenceNode,
} from "../../../interface/block.interface";
import {
    createBlockBase,
    createBlockType,
    createContentNode,
    createEntityReferenceMetadata,
    createReference,
} from "./block.factory";
import {
    ALL_BLOCK_COMPONENT_TYPES,
    createBlockListBlockType,
    createEntityReferenceListType,
    createLayoutContainerBlockType,
    createAddressBlockType,
    createNoteBlockType,
    DEFAULT_GRID_LAYOUT,
} from "./type.factory";

/**
 * ============================================================================
 * Block Nodes
 * ============================================================================
 */

/**
 * Creates a rich client overview block with multiple components:
 * - Contact card (left)
 * - Address list (right)
 *
 * This demonstrates:
 * 1. Multiple components in one block (2-column layout)
 * 2. Data bindings from block payload
 * 3. RefSlot bindings for child blocks
 */
export function createContactBlockNode(organisationId: string): BlockNode {
    const addressType = createAddressBlockType(organisationId);

    // Create address child blocks
    const addressNodes = [
        createContentNode({
            organisationId,
            type: addressType,
            name: "Primary address",
            data: {
                title: "Headquarters",
                description: "Billing address",
                address: {
                    street: "1 Collins St",
                    city: "Melbourne",
                    state: "VIC",
                    postalCode: "3000",
                    country: "Australia",
                },
            },
        }),
        createContentNode({
            organisationId,
            type: addressType,
            name: "Service address",
            data: {
                title: "Customer success",
                description: "Support location",
                address: {
                    street: "2 George St",
                    city: "Sydney",
                    state: "NSW",
                    postalCode: "2000",
                    country: "Australia",
                },
            },
        }),
    ];

    // Create a BlockType with multiple components
    const clientOverviewType: BlockType = {
        id: uniqueId("type-client-overview"),
        key: "client_overview_multi",
        version: 1,
        name: "Client Overview",
        description: "Contact card with address list side-by-side",
        organisationId,
        archived: false,
        strictness: "SOFT",
        system: false,
        schema: {
            name: "ClientOverview",
            type: "OBJECT",
            required: true,
            properties: {
                name: { name: "Name", type: "STRING", required: true },
                email: { name: "Email", type: "STRING", required: false },
                phone: { name: "Phone", type: "STRING", required: false },
                company: { name: "Company", type: "STRING", required: false },
            },
        },
        display: {
            form: { fields: {} },
            render: {
                version: 1,
                layoutGrid: {
                    layout: DEFAULT_GRID_LAYOUT,
                    rowHeight: 40,
                    margin: 8,
                    items: [
                        // Contact card on left (cols 0-5)
                        {
                            id: "contact_card",
                            sm: { x: 0, y: 0, w: 12, h: 8, locked: false },
                            lg: { x: 0, y: 0, w: 6, h: 10, locked: false },
                        },
                        // Address list on right (cols 6-11)
                        {
                            id: "address_list",
                            sm: { x: 0, y: 8, w: 12, h: 8, locked: false },
                            lg: { x: 6, y: 0, w: 6, h: 10, locked: false },
                        },
                    ],
                },
                components: {
                    contact_card: {
                        id: "contact_card",
                        type: "CONTACT_CARD",
                        props: {
                            avatarShape: "circle",
                        },
                        bindings: [
                            {
                                prop: "client",
                                source: {
                                    type: "DataPath",
                                    path: "$.data",
                                },
                            },
                        ],
                        fetchPolicy: "LAZY",
                    },
                    address_list: {
                        id: "address_list",
                        type: "LINE_ITEM",
                        props: {
                            title: "Addresses",
                            itemComponent: "ADDRESS_CARD",
                            emptyMessage: "No addresses",
                        },
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
            },
        },
        nesting: {
            max: undefined,
            allowedTypes: ALL_BLOCK_COMPONENT_TYPES,
        },
        createdAt: nowIso(),
        updatedAt: nowIso(),
    };

    return createContentNode({
        organisationId,
        type: clientOverviewType,
        name: "Jane Doe",
        data: {
            name: "Jane Doe",
            email: "jane@acme.com",
            phone: "+61 400 123 456",
            company: "Acme Corporation",
        },
        children: {
            addresses: addressNodes,
        },
    });
}

export function createProjectBlockNode(organisationId: string): BlockNode {
    const projectType = createProjectOverviewType(organisationId);
    const taskType = createTaskBlockType(organisationId);
    const layoutType = createLayoutContainerBlockType(organisationId);
    const listType = createBlockListBlockType(organisationId);

    const taskNodes = createTaskNodes(organisationId, taskType);

    const taskListNode = createContentNode({
        organisationId,
        type: listType,
        name: "Active tasks",
        data: {
            title: "Active tasks",
            description: "Tracked tasks for this project",
            emptyMessage: "Add a task",
        },
        children: {
            items: taskNodes,
        },
    });

    const layoutNode = createContentNode({
        organisationId,
        type: layoutType,
        name: "Project details",
        data: {
            title: "Project details",
            description: "Tasks and commentary",
        },
        children: {
            main: [taskListNode],
        },
    });

    return createContentNode({
        organisationId,
        type: projectType,
        name: "Project health",
        data: {
            name: "Onboarding Portal Revamp",
            status: "In progress",
            summary: "Reworking onboarding flows and portal UI for enterprise clients.",
        },
        children: {
            body: [layoutNode],
        },
    });
}

export function createNoteNode(organisationId: string, content?: string): BlockNode {
    const noteType = createNoteBlockType(organisationId);

    return createContentNode({
        organisationId,
        type: noteType,
        name: "Note",
        data: {
            content: content ?? "Start typing...",
        },
    });
}

/**
 * Creates a layout container with nested blocks.
 *
 * This demonstrates:
 * 1. Wildcard slots ("*") for dynamic child blocks
 * 2. Layout container holding multiple different block types
 */
export function createLayoutContainerNode(organisationId: string): BlockNode {
    const layoutType = createLayoutContainerBlockType(organisationId);
    const noteType = createNoteBlockType(organisationId);

    // Create some nested blocks
    const nestedBlocks = [
        createContentNode({
            organisationId,
            type: noteType,
            name: "Welcome note",
            data: {
                content: "Welcome to the block environment! This is a nested block inside a layout container.",
            },
        }),
        createContentNode({
            organisationId,
            type: noteType,
            name: "Instructions",
            data: {
                content: "You can add, remove, and rearrange blocks using the toolbar. Try dragging blocks around!",
            },
        }),
    ];

    return createContentNode({
        organisationId,
        type: layoutType,
        name: "Getting Started",
        data: {
            title: "Getting Started",
            description: "An introduction to block environments",
        },
        children: {
            main: nestedBlocks,
        },
    });
}

/**
 * ============================================================================
 * Block Types
 * ============================================================================
 */

export const createContactBlockType = (organisationId: string): BlockType => {
    const component: BlockComponentNode = {
        id: "contactCard",
        type: "CONTACT_CARD",
        props: {
            avatarShape: "circle",
        },
        bindings: [
            {
                prop: "client",
                source: {
                    type: "RefSlot",
                    slot: "client",
                    presentation: "SUMMARY",
                    expandDepth: 1,
                },
            },
            {
                prop: "href",
                source: { type: "DataPath", path: "$.data/profileUrl" },
            },
            {
                prop: "avatarUrl",
                source: { type: "DataPath", path: "$.data/avatarUrl" },
            },
        ],
        fetchPolicy: "LAZY",
    };

    const render: BlockRenderStructure = {
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
    };

    return createBlockType({
        key: "contact_overview",
        name: "Contact Overview",
        description: "Displays client summary with linked account data.",
        organisationId,
        schema: {
            name: "ContactOverview",
            type: "OBJECT",
            required: true,
            properties: {
                name: { name: "Name", type: "STRING", required: true },
                email: { name: "Email", type: "STRING", required: false, format: "EMAIL" },
                phone: { name: "Phone", type: "STRING", required: false },
                profileUrl: { name: "Profile URL", type: "STRING", required: false },
            },
        },
        render,
        nesting: {
            max: undefined,
            allowedTypes: ALL_BLOCK_COMPONENT_TYPES,
        },
    });
};

const createAddressBlockType = (organisationId: string): BlockType => {
    const component: BlockComponentNode = {
        id: "addressCard",
        type: "ADDRESS_CARD",
        props: {},
        bindings: [
            { prop: "title", source: { type: "DataPath", path: "$.data/title" } },
            { prop: "description", source: { type: "DataPath", path: "$.data/description" } },
            {
                prop: "address",
                source: { type: "DataPath", path: "$.data/address" },
            },
        ],
        fetchPolicy: "LAZY",
    };

    const render: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            layout: DEFAULT_GRID_LAYOUT,
            items: [
                {
                    id: component.id,
                    sm: { x: 0, y: 0, width: 12, height: 6, locked: false },
                    lg: { x: 0, y: 0, width: 12, height: 6, locked: false },
                },
            ],
        },
        components: { [component.id]: component },
    };

    return createBlockType({
        key: "postal_address",
        name: "Postal Address",
        description: "Physical address for a contact or organisation.",
        organisationId,
        schema: {
            name: "Address",
            type: "OBJECT",
            required: true,
            properties: {
                title: { name: "Title", type: "STRING", required: false },
                description: { name: "Description", type: "STRING", required: false },
                address: {
                    name: "Address",
                    type: "OBJECT",
                    required: true,
                    properties: {
                        street: { name: "Street", type: "STRING", required: true },
                        city: { name: "City", type: "STRING", required: true },
                        state: { name: "State", type: "STRING", required: true },
                        postalCode: { name: "Postal Code", type: "STRING", required: true },
                        country: { name: "Country", type: "STRING", required: true },
                    },
                },
            },
        },
        render,
        nesting: null,
    });
};

const createTaskBlockType = (organisationId: string): BlockType => {
    const component: BlockComponentNode = {
        id: "task",
        type: "TEXT",
        props: {
            variant: "body",
        },
        bindings: [
            {
                prop: "text",
                source: { type: "DataPath", path: "$.data/title" },
            },
        ],
        fetchPolicy: "LAZY",
    };

    const render: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            layout: DEFAULT_GRID_LAYOUT,
            items: [
                {
                    id: component.id,
                    sm: { x: 0, y: 0, width: 12, height: 4, locked: false },
                    lg: { x: 0, y: 0, width: 12, height: 4, locked: false },
                },
            ],
        },
        components: { [component.id]: component },
    };

    return createBlockType({
        key: "project_task",
        name: "Project Task",
        description: "Individual task item for a project.",
        organisationId,
        schema: {
            name: "Task",
            type: "OBJECT",
            required: true,
            properties: {
                title: { name: "Title", type: "STRING", required: true },
                assignee: { name: "Assignee", type: "STRING", required: false },
                status: { name: "Status", type: "STRING", required: false },
                dueDate: { name: "Due date", type: "STRING", required: false, format: "DATE" },
            },
        },
        render,
        nesting: null,
    });
};

const createNoteBlockType = (organisationId: string): BlockType => {
    const component: BlockComponentNode = {
        id: "note",
        type: "TEXT",
        props: {
            variant: "body",
        },
        bindings: [{ prop: "text", source: { type: "DataPath", path: "$.data/content" } }],
        fetchPolicy: "LAZY",
    };

    const render: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            layout: DEFAULT_GRID_LAYOUT,
            items: [
                {
                    id: component.id,
                    sm: { x: 0, y: 0, width: 12, height: 6, locked: false },
                    lg: { x: 0, y: 0, width: 12, height: 6, locked: false },
                },
            ],
        },
        components: { [component.id]: component },
    };

    return createBlockType({
        key: "note",
        name: "Note",
        description: "Simple rich text note.",
        organisationId,
        schema: {
            name: "Note",
            type: "OBJECT",
            required: true,
            properties: {
                content: { name: "Content", type: "STRING", required: true },
            },
        },
        render,
        nesting: null,
    });
};

const createProjectOverviewType = (organisationId: string): BlockType => {
    const component: BlockComponentNode = {
        id: "summary",
        type: "TEXT",
        props: {
            variant: "body",
        },
        bindings: [
            {
                prop: "text",
                source: { type: "DataPath", path: "$.data/summary" },
            },
        ],
        fetchPolicy: "LAZY",
    };

    const render: BlockRenderStructure = {
        version: 1,
        layoutGrid: {
            layout: DEFAULT_GRID_LAYOUT,
            items: [
                {
                    id: component.id,
                    sm: { x: 0, y: 0, width: 12, height: 6, locked: false },
                    lg: { x: 0, y: 0, width: 12, height: 6, locked: false },
                },
            ],
        },
        components: { [component.id]: component },
    };

    return createBlockType({
        key: "project_overview",
        name: "Project Overview",
        description: "High-level project summary block.",
        organisationId,
        schema: {
            name: "ProjectOverview",
            type: "OBJECT",
            required: true,
            properties: {
                name: { name: "Name", type: "STRING", required: true },
                status: { name: "Status", type: "STRING", required: false },
                summary: { name: "Summary", type: "STRING", required: false },
            },
        },
        render,
        nesting: {
            max: undefined,
            allowedTypes: ALL_BLOCK_COMPONENT_TYPES,
        },
    });
};

const createTaskNodes = (organisationId: string, taskType: BlockType) => {
    const tasks = [
        {
            title: "Wireframes",
            assignee: "Jane Doe",
            status: "IN_REVIEW",
            dueDate: "2024-07-12",
        },
        {
            title: "Analytics events",
            assignee: "Kai Wong",
            status: "IN_PROGRESS",
            dueDate: "2024-07-19",
        },
        {
            title: "Rollout comms",
            assignee: "Tina Patel",
            status: "NOT_STARTED",
            dueDate: "2024-07-26",
        },
    ];

    return tasks.map((task) =>
        createContentNode({
            organisationId,
            type: taskType,
            data: task,
            name: task.title,
        })
    );
};
