import { uniqueId } from "@/lib/util/utils";
import {
    BlockComponentNode,
    BlockRenderStructure,
    BlockTree,
    BlockType,
    ReferenceNode,
} from "../../../interface/block.interface";
import {
    createBlockBase,
    createBlockType,
    createContentNode,
    createEntityReferenceMetadata,
    createReference,
    GRID_LAYOUT,
} from "./block.factory";
import {
    ALL_BLOCK_COMPONENT_TYPES,
    createBlockListBlockType,
    createEntityReferenceListType,
    createLayoutContainerBlockType,
} from "./type.factory";

export function createContactBlockTree(organisationId: string): BlockTree {
    const addressType = createAddressBlockType(organisationId);
    const layoutType = createLayoutContainerBlockType(organisationId);
    const listType = createBlockListBlockType(organisationId);
    const entityReferenceType = createEntityReferenceListType(organisationId);

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

    const addressListNode = createContentNode({
        organisationId,
        type: listType,
        name: "Addresses",
        data: {
            title: "Addresses",
            description: "Primary and secondary locations",
            emptyMessage: "Add an address",
        },
        children: {
            items: addressNodes,
        },
    });

    const clientEntityId = uniqueId("client");
    const entityReferenceNode: ReferenceNode = {
        type: "reference_node",
        block: createBlockBase({
            organisationId,
            type: entityReferenceType,
            name: "Key contacts",
            payload: createEntityReferenceMetadata({
                items: [
                    { type: "client", id: clientEntityId, labelOverride: "Jane Doe" },
                    { type: "client", id: uniqueId("client"), labelOverride: "Kai Wong" },
                ],
                projection: { fields: ["name", "contact.email"] },
                sort: { by: "name", dir: "ASC" },
                paging: { pageSize: 20 },
            }),
        }),
        warnings: [],
        reference: {
            type: "entity_reference",
            reference: [
                createReference({
                    type: "client",
                    entityId: clientEntityId,
                    path: "$.items[0]",
                    order: 0,
                    entity: {
                        id: clientEntityId,
                        organisationId: "dd",
                        type: "client",
                        name: "Jane Doe",
                        contact: {
                            email: "jane@acme.com",
                        },
                        archived: false,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                    },
                }),
            ],
        },
    };

    const layoutNode = createContentNode({
        organisationId,
        type: layoutType,
        name: "Client details",
        data: {
            title: "Client details",
            description: "Addresses and related entities",
        },
        children: {
            main: [addressListNode, entityReferenceNode],
        },
    });

    return {
        type: "block_tree",
        root: layoutNode,
    };
}

export function createProjectBlockTree(organisationId: string): BlockTree {
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

    const root = createContentNode({
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

    return {
        type: "block_tree",
        root,
    };
}

export function createNoteBlockTree(organisationId: string, content?: string): BlockTree {
    const noteType = createNoteBlockType(organisationId);

    const root = createContentNode({
        organisationId,
        type: noteType,
        name: "Note",
        data: {
            content: content ?? "Start typing...",
        },
    });

    return {
        type: "block_tree",
        root,
    };
}

export function createBlankPanelTree(organisationId: string): BlockTree {
    const layoutType = createLayoutContainerBlockType(organisationId);

    const root = createContentNode({
        organisationId,
        type: layoutType,
        name: "Layout container",
        data: {
            title: "",
            description: "",
        },
    });

    return {
        type: "block_tree",
        root,
    };
}

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
            ...GRID_LAYOUT,
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
            ...GRID_LAYOUT,
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
            ...GRID_LAYOUT,
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
            ...GRID_LAYOUT,
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
            ...GRID_LAYOUT,
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
