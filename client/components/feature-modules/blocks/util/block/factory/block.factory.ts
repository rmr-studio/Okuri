import {
    BlockMetadataType,
    BlockValidationScope,
    EntityType,
    NodeType,
    ReferenceType,
} from "@/lib/types/types";
import { now } from "@/lib/util/utils";
import { v4 as uuid } from "uuid";
import {
    Block,
    BlockContentMetadata,
    BlockDisplay,
    BlockMeta,
    BlockReferencePayload,
    BlockSchema,
    BlockTree,
    BlockType,
    BlockTypeNesting,
    ContentNode,
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
    deletable: boolean = true
): BlockContentMetadata => ({
    type: BlockMetadataType.CONTENT,
    deletable,
    data: data ?? {},
    meta: createMeta(overrides),
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
