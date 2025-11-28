import { now } from "@/lib/util/utils";
import { v4 as uuid } from "uuid";
import {
    Block,
    BlockContentMetadata,
    BlockDisplay,
    BlockMeta,
    BlockNode,
    BlockReferenceMetadata,
    BlockReferencePayload,
    BlockSchema,
    BlockTree,
    BlockType,
    BlockTypeNesting,
    EntityReferenceMetadata,
    EntityReferencePayload,
    Metadata,
    Node,
    Reference,
    Referenceable,
    ReferenceItem,
    ReferenceNode,
    ReferencePayload,
    ReferenceWarning,
} from "../../../interface/block.interface";
import { NodeType } from "@/lib/types/types";

const createMeta = (overrides?: Partial<BlockMeta>): BlockMeta => ({
    validationErrors: overrides?.validationErrors ?? [],
    computedFields: overrides?.computedFields,
    lastValidatedVersion: overrides?.lastValidatedVersion,
});

export const createContentMetadata = (
    data: Record<string, unknown>,
    overrides?: Partial<BlockMeta>
): BlockContentMetadata => ({
    type: "content",
    data,
    meta: createMeta(overrides),
});

export const createEntityReferenceMetadata = ({
    items,
    presentation = "SUMMARY",
    projection,
    sort,
    paging,
    filter,
    allowDuplicates = false,
    fetchPolicy = "LAZY",
    path = "$.items",
    meta,
}: {
    items: ReferenceItem[];
    presentation?: EntityReferenceMetadata["presentation"];
    projection?: EntityReferenceMetadata["projection"];
    sort?: EntityReferenceMetadata["sort"];
    paging?: EntityReferenceMetadata["paging"];
    filter?: EntityReferenceMetadata["filter"];
    allowDuplicates?: boolean;
    fetchPolicy?: EntityReferenceMetadata["fetchPolicy"];
    path?: string;
    meta?: Partial<BlockMeta>;
}): EntityReferenceMetadata => ({
    type: "entity_reference",
    fetchPolicy,
    path,
    items,
    presentation,
    projection,
    sort,
    filter,
    paging,
    allowDuplicates,
    meta: createMeta(meta),
});

export const createBlockReferenceMetadata = ({
    item,
    expandDepth = 1,
    fetchPolicy = "LAZY",
    path = "$.block",
    meta,
}: {
    item: ReferenceItem;
    expandDepth?: number;
    fetchPolicy?: BlockReferenceMetadata["fetchPolicy"];
    path?: string;
    meta?: Partial<BlockMeta>;
}): BlockReferenceMetadata => ({
    type: "block_reference",
    fetchPolicy,
    path,
    expandDepth,
    item,
    meta: createMeta(meta),
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
}: {
    organisationId: string;
    type: BlockType;
    data?: Record<string, unknown>;
    name?: string;
    id?: string;
    children?: Node[];
    payloadOverride?: Metadata;
}): BlockNode => ({
    type: NodeType.CONTENT,
    block: createBlockBase({
        id,
        organisationId,
        type,
        name,
        payload: payloadOverride ?? createContentMetadata(data ?? {}),
    }),
    children,
    warnings: [],
});



export const createBlockReference = ({ block }: { block: BlockTree }): BlockReferencePayload => {
    const reference = createReference({
        type: "block_tree",
        entityId: block.root.block.id,
        entity: block,
    });

    return {
        type: "block_reference",
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
    strictness: "SOFT",
    system: false,
    schema,
    display,
    nesting: nesting ?? undefined,
    createdAt: now(),
    updatedAt: now(),
});
