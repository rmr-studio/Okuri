import { nowIso, uniqueId } from "@/lib/util/utils";
import {
    Block,
    BlockContentMetadata,
    BlockMeta,
    BlockNode,
    BlockReferenceMetadata,
    BlockReferencePayload,
    BlockRenderStructure,
    BlockSchema,
    BlockTree,
    BlockType,
    BlockTypeNesting,
    EntityReferenceMetadata,
    EntityReferencePayload,
    EntityType,
    NodeType,
    Reference,
    Referenceable,
    ReferenceItem,
    ReferenceNode,
    ReferencePayload,
    ReferenceWarning,
} from "../../../interface/block.interface";

const createMeta = (overrides?: Partial<BlockMeta>): BlockMeta => ({
    validationErrors: [],
    computedFields: overrides?.computedFields,
    lastValidatedVersion: overrides?.lastValidatedVersion,
});

export const createContentMetadata = (
    data: Record<string, unknown>,
    overrides?: Partial<BlockMeta>
): BlockContentMetadata => ({
    type: "block_reference",
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

const createBlockReferenceMetadata = ({
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

const createBlockBase = ({
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
    payload: Block["payload"];
    archived?: boolean;
}): Block => ({
    id: id ?? uniqueId("block"),
    name,
    organisationId,
    type,
    payload,
    archived,
    createdAt: nowIso(),
    updatedAt: nowIso(),
});

const createContentNode = ({
    organisationId,
    type,
    data,
    name,
    id,
    children,
}: {
    organisationId: string;
    type: BlockType;
    data: Record<string, unknown>;
    name?: string;
    id?: string;
    children?: Record<string, BlockNode[]>;
}): BlockNode => ({
    type: "content_node",
    block: createBlockBase({
        id,
        organisationId,
        type,
        name,
        payload: createContentMetadata(data),
    }),
    children,
    warnings: [],
});

const createReferenceNode = ({
    type,
    reference,
    block,
    warnings,
}: {
    type: NodeType;
    block: Block;
    reference: ReferencePayload;
    warnings?: string[];
}): ReferenceNode => ({
    type,
    block,
    reference,
    warnings: warnings ?? [],
});

const createEntityReference = ({
    entities,
}: {
    entities: Referenceable[];
}): EntityReferencePayload => {
    if (entities.length === 0) {
        throw new Error("No entities provided");
    }

    if (entities.some((entity) => entity.type === "block_tree"))
        throw new Error("Entities contain block tree, use createBlockReference instead");
    return {
        type: "entity_reference",
        reference: entities.map((entity, index) =>
            createReference({
                type: entity.type,
                // todo ensure all references have valid IDs
                // currently things like block trees dont have a unique id property
                entityId: (entity as any).id || uniqueId("entity"),
                order: index,
                entity,
            })
        ),
    };
};

const createBlockReference = ({ block }: { block: BlockTree }): BlockReferencePayload => {
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

const createReference = ({
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
        id: uniqueId("ref"),
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
    render,
    nesting,
}: {
    key: string;
    name: string;
    description?: string;
    organisationId: string;
    schema: BlockSchema;
    render: BlockRenderStructure;
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
    display: {
        form: { fields: {} },
        render,
    },
    nesting: nesting ?? undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
});

export const GRID_LAYOUT = {
    cols: 12,
    rowHeight: 60,
    margin: 16,
};
