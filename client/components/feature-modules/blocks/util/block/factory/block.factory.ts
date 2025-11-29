import {
    BlockListOrderingMode,
    BlockMetadataType,
    BlockReferenceFetchPolicy,
    BlockValidationScope,
    EntityType,
    ListFilterLogicType,
    NodeType,
    Presentation,
    ReferenceType,
} from "@/lib/types/types";
import { now } from "@/lib/util/utils";
import { v4 as uuid } from "uuid";
import {
    Block,
    BlockContentMetadata,
    BlockDisplay,
    BlockMeta,
    BlockReferenceMetadata,
    BlockReferencePayload,
    BlockSchema,
    BlockTree,
    BlockType,
    BlockTypeNesting,
    ContentNode,
    EntityReferenceMetadata,
    Metadata,
    Reference,
    Referenceable,
    ReferenceWarning,
} from "../../../interface/block.interface";

const createMeta = (overrides?: Partial<BlockMeta>): BlockMeta => ({
    validationErrors: overrides?.validationErrors ?? [],
    computedFields: overrides?.computedFields,
    lastValidatedVersion: overrides?.lastValidatedVersion,
});

export const createContentMetadata = (
    data?: Record<string, unknown>,
    overrides?: Partial<BlockMeta>,
    deletable: boolean = true,
    listConfig?: import("../../../interface/block.interface").BlockListConfiguration
): BlockContentMetadata => ({
    type: BlockMetadataType.CONTENT,
    deletable,
    data: data ?? {},
    meta: createMeta(overrides),
    listConfig,
});

/**
 * Creates BlockListConfiguration for list blocks.
 * Used when creating blocks that manage lists of child blocks.
 */
export const createListConfiguration = (
    allowedTypes?: string[]
): import("../../../interface/block.interface").BlockListConfiguration => ({
    allowedTypes,
    allowDuplicates: false,
    display: {
        itemSpacing: 8,
        showDragHandles: true,
        emptyMessage: "No items yet",
    },
    config: {
        mode: BlockListOrderingMode.MANUAL,
        filters: [],
        filterLogic: ListFilterLogicType.AND,
    },
});

/**
 * Creates EntityReferenceMetadata for entity reference blocks.
 * Used when creating blocks that reference external entities (clients, organizations, etc.)
 */
export const createEntityReferenceMetadata = (
    overrides?: Partial<BlockMeta>,
    deletable: boolean = true
): EntityReferenceMetadata => ({
    type: BlockMetadataType.ENTITY_REFERENCE,
    deletable,
    meta: createMeta(overrides),
    path: "",
    fetchPolicy: BlockReferenceFetchPolicy.LAZY,
    presentation: Presentation.ENTITY,
    items: [],
    projection: {
        fields: [],
    },
    display: {
        itemSpacing: 8,
        showDragHandles: false,
        emptyMessage: "No entities selected",
    },
    config: {
        mode: BlockListOrderingMode.MANUAL,
        filters: [],
        filterLogic: ListFilterLogicType.AND,
    },
    allowDuplicates: false,
});

/**
 * Creates BlockReferenceMetadata for block reference blocks.
 * Used when creating blocks that reference other block trees.
 */
export const createBlockReferenceMetadata = (
    overrides?: Partial<BlockMeta>,
    deletable: boolean = true
): BlockReferenceMetadata => ({
    type: BlockMetadataType.BLOCK_REFERENCE,
    deletable,
    meta: createMeta(overrides),
    path: "",
    fetchPolicy: BlockReferenceFetchPolicy.LAZY,
    expandDepth: 1,
    item: {
        type: EntityType.BLOCK_TREE,
        id: "",
    },
});

export const createBlockBase = ({
    id,
    organisationId,
    type,
    name,
    payload,
    archived = false,
}: {
    id?: string;
    organisationId: string;
    type: BlockType;
    name?: string;
    payload: Metadata;
    archived?: boolean;
}): Block => ({
    id: id ?? uuid(),
    name,
    organisationId,
    type,
    payload,
    archived,
    createdAt: now(),
    updatedAt: now(),
});

export const createContentNode = ({
    organisationId,
    type,
    data,
    name,
    id,
    children,
    payloadOverride,
    deletable = true,
}: {
    organisationId: string;
    type: BlockType;
    data?: Record<string, unknown>;
    name?: string;
    id?: string;
    deletable?: boolean;
    children?: ContentNode[];
    payloadOverride?: Metadata;
}): ContentNode => ({
    type: NodeType.CONTENT,
    block: createBlockBase({
        id,
        organisationId,
        type,
        name,
        payload: payloadOverride ?? createContentMetadata(data, undefined, deletable),
    }),
    children,
    warnings: [],
});

/**
 * Creates a ReferenceNode for entity or block references.
 * Reference nodes are used to embed external entities or other block trees.
 */
export const createReferenceNode = ({
    organisationId,
    type,
    name,
    id,
    payload,
    deletable = true,
}: {
    organisationId: string;
    type: BlockType;
    name?: string;
    id?: string;
    payload:
        | import("../../../interface/block.interface").EntityReferenceMetadata
        | import("../../../interface/block.interface").BlockReferenceMetadata;
    deletable?: boolean;
}): import("../../../interface/block.interface").ReferenceNode => {
    // Create empty reference payload based on metadata type
    const reference =
        payload.type === BlockMetadataType.ENTITY_REFERENCE
            ? {
                  type: ReferenceType.ENTITY as const,
                  reference: [] as Reference[],
              }
            : {
                  type: ReferenceType.BLOCK as const,
                  reference: {} as Reference,
              };

    return {
        type: NodeType.REFERENCE,
        block: createBlockBase({
            id,
            organisationId,
            type,
            name,
            payload,
        }),
        reference,
        warnings: [],
    };
};

export const createBlockReference = ({ block }: { block: BlockTree }): BlockReferencePayload => {
    const reference = createReference({
        type: EntityType.BLOCK_TREE,
        entityId: block.root.block.id,
        entity: block,
    });

    return {
        type: ReferenceType.BLOCK,
        reference,
    };
};

export const createReference = ({
    type,
    entityId,
    path,
    order,
    entity,
    warning,
}: {
    type: EntityType;
    entityId: string;
    path?: string;
    order?: number;
    entity: Referenceable;
    warning?: ReferenceWarning;
}): Reference => {
    return {
        id: uuid(),
        entityType: type,
        entityId,
        path,
        orderIndex: order,
        entity,
        warning,
    };
};

export const createBlockType = ({
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
    organisationId: string;
    schema: BlockSchema;
    display: BlockDisplay;
    nesting?: BlockTypeNesting | null;
}): BlockType => ({
    id: uuid(),
    key,
    version: 1,
    name,
    description,
    organisationId,
    archived: false,
    strictness: BlockValidationScope.SOFT,
    system: false,
    schema,
    display,
    nesting: nesting ?? undefined,
    createdAt: now(),
    updatedAt: now(),
});
