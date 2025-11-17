import { components, operations } from "@/lib/types/types";

/* -------------------------------------------------------------------------- */
/*                               Core Re-exports                              */
/* -------------------------------------------------------------------------- */

export type Block = components["schemas"]["Block"];
export type BlockType = components["schemas"]["BlockType"];
export type BlockSchema = components["schemas"]["BlockSchema"];
export type BlockDisplay = components["schemas"]["BlockDisplay"];
export type BlockFormStructure = components["schemas"]["BlockFormStructure"];
export type BlockRenderStructure = components["schemas"]["BlockRenderStructure"];
export type BlockBinding = components["schemas"]["BlockBinding"];
export type BlockComponentNode = components["schemas"]["BlockComponentNode"];
export type ComponentType = components["schemas"]["BlockComponentNode"]["type"];
export type BlockMeta = components["schemas"]["BlockMeta"];
export type BlockTypeNesting = components["schemas"]["BlockType"]["nesting"];

// Extended BlockListConfiguration with client-side filter/sort support
// TODO: Update backend schema to include these properties
export type BlockListConfiguration = components["schemas"]["BlockListConfiguration"] & {
    filters?: Array<{
        expr: {
            [key: string]: unknown;
        };
    }>;
    filterLogic?: "AND" | "OR";
};

export type NodeType = components["schemas"]["Node"]["type"];

/* -------------------------------------------------------------------------- */
/*                              Tree Type Helpers                             */
/* -------------------------------------------------------------------------- */

export type BlockTree = components["schemas"]["BlockTree"];

export type Referenceable = components["schemas"]["Referenceable"];

export type ContentNode = components["schemas"]["ContentNode"];
export type ReferenceNode = components["schemas"]["ReferenceNode"];

export type EntityReferencePayload = components["schemas"]["EntityReference"];
export type BlockReferencePayload = components["schemas"]["BlockTreeReference"];
export type Reference = components["schemas"]["Reference"];
export type ReferenceWarning = components["schemas"]["Reference"]["warning"];

export type ReferencePayload = EntityReferencePayload | BlockReferencePayload;
export type ReferenceType = ReferencePayload["type"];
export type Metadata = BlockContentMetadata | BlockReferenceMetadata | EntityReferenceMetadata;
export type BlockNode = ContentNode | ReferenceNode;

/* -------------------------------------------------------------------------- */
/*                           Reference Type Helpers                           */
/* -------------------------------------------------------------------------- */

export type BlockTreeReference = components["schemas"]["BlockTreeReference"];

export type ReferenceItem = components["schemas"]["ReferenceItem"];

/* -------------------------------------------------------------------------- */
/*                              Metadata Variants                             */
/* -------------------------------------------------------------------------- */

export type BlockMetadata = components["schemas"]["Metadata"];
export type BlockContentMetadata = components["schemas"]["BlockContentMetadata"];
export type BlockReferenceMetadata = components["schemas"]["BlockReferenceMetadata"];
export type EntityReferenceMetadata = components["schemas"]["EntityReferenceMetadata"];

/* -------------------------------------------------------------------------- */
/*                        Requests / Response Convenience                     */
/* -------------------------------------------------------------------------- */

export type CreateBlockRequest = components["schemas"]["CreateBlockRequest"];
export type CreateBlockTypeRequest = components["schemas"]["CreateBlockTypeRequest"];

export type GetBlockResponse = operations["getBlock"]["responses"]["200"]["content"]["*/*"];
export type GetBlockTypesResponse =
    operations["getBlockTypes"]["responses"]["200"]["content"]["*/*"];

/* -------------------------------------------------------------------------- */
/*                                 Type Guards                                */
/* -------------------------------------------------------------------------- */

export const isContentMetadata = (payload: Block["payload"]): payload is BlockContentMetadata =>
    payload?.type === "content";

export const isBlockReferenceMetadata = (
    payload: Block["payload"]
): payload is BlockReferenceMetadata => payload?.type === "block_reference";

export const isEntityReferenceMetadata = (
    payload: Block["payload"]
): payload is EntityReferenceMetadata => payload?.type === "entity_reference";

export const isContentNode = (node: BlockNode): node is ContentNode =>
    !!node.block && node.type === "content_node";

export const isReferenceNode = (node: BlockNode): node is ReferenceNode =>
    !!node.block && node.type === "reference_node";

/* -------------------------------------------------------------------------- */
