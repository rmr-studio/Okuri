import {
    BlockComponentNode,
    BlockListConfiguration,
    BlockNode,
    BlockRenderStructure,
    BlockType,
} from "../../../interface/block.interface";
import { createBlockType, createContentNode } from "./block.factory";
import {
    ALL_BLOCK_COMPONENT_TYPES,
    createBlockListBlockType,
    createContentBlockListType,
    createLayoutContainerBlockType,
    DEFAULT_GRID_LAYOUT,
} from "./type.factory";

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
        children: taskNodes,
    });

    const layoutNode = createContentNode({
        organisationId,
        type: layoutType,
        name: "Project details",
        data: {
            title: "Project details",
            description: "Tasks and commentary",
        },
        children: [taskListNode],
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
        children: [layoutNode],
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
                content:
                    "Welcome to the block environment! This is a nested block inside a layout container.",
            },
        }),
        createContentNode({
            organisationId,
            type: noteType,
            name: "Instructions",
            data: {
                content:
                    "You can add, remove, and rearrange blocks using the toolbar. Try dragging blocks around!",
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
        children: nestedBlocks,
    });
}

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

/**
 * Creates a content block list containing task items
 * Demonstrates manual ordering mode with drag-to-reorder
 */
export function createTaskListNode(organisationId: string): BlockNode {
    const listType = createContentBlockListType(organisationId);
    const taskType = createTaskBlockType(organisationId);

    // Create task items
    const tasks = [
        createContentNode({
            organisationId,
            type: taskType,
            data: {
                title: "Design wireframes",
                assignee: "Jane Doe",
                status: "IN_PROGRESS",
                dueDate: "2024-12-15",
            },
            name: "Design wireframes",
        }),
        createContentNode({
            organisationId,
            type: taskType,
            data: {
                title: "Implement authentication",
                assignee: "John Smith",
                status: "NOT_STARTED",
                dueDate: "2024-12-20",
            },
            name: "Implement authentication",
        }),
        createContentNode({
            organisationId,
            type: taskType,
            data: {
                title: "Write documentation",
                assignee: "Alice Johnson",
                status: "NOT_STARTED",
                dueDate: "2024-12-25",
            },
            name: "Write documentation",
        }),
    ];

    // Create list with manual ordering configuration
    const listConfig: BlockListConfiguration = {
        allowedTypes: ["project_task"],
        allowDuplicates: false,
        display: {
            itemSpacing: 12,
            showDragHandles: true,
            emptyMessage: "No tasks yet. Add one to get started!",
        },
        order: {
            mode: "MANUAL",
        },
    };

    return createContentNode({
        organisationId,
        type: listType,
        name: "Project Tasks",
        data: {
            title: "Project Tasks",
            description: "Drag to reorder tasks",
        },
        children: tasks,

        // Override payload to include listConfig
        payloadOverride: {
            type: "content",
            meta: { validationErrors: [] },
            data: {
                title: "Project Tasks",
                description: "Drag to reorder tasks",
            },
            listConfig,
        },
    });
}
