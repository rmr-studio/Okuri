import { BlockMetadataType, components, NodeType, operations } from "@/lib/types/types";

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
export type BlockMeta = components["schemas"]["BlockMeta"];
export type BlockTypeNesting = components["schemas"]["BlockType"]["nesting"];

export type BlockListConfiguration = components["schemas"]["BlockListConfiguration"];

/* -------------------------------------------------------------------------- */
/*                              Tree Type Helpers                             */
/* -------------------------------------------------------------------------- */

export type BlockEnvironment = components["schemas"]["BlockEnvironment"];

export type BlockTree = components["schemas"]["BlockTree"];
export type TreeLayout = components["schemas"]["TreeLayout"];
export type Widget = components["schemas"]["Widget"];

export type Referenceable = components["schemas"]["Referenceable"];

export type ContentNode = components["schemas"]["ContentNode"];
export type ReferenceNode = components["schemas"]["ReferenceNode"];

export type EntityReferencePayload = components["schemas"]["EntityReference"];
export type BlockReferencePayload = components["schemas"]["BlockTreeReference"];
export type Reference = components["schemas"]["Reference"];
export type ReferenceWarning = components["schemas"]["Reference"]["warning"];

export type ReferencePayload = EntityReferencePayload | BlockReferencePayload;
export type Metadata = BlockContentMetadata | BlockReferenceMetadata | EntityReferenceMetadata;
export type Node = components["schemas"]["Node"];
export type BlockNode = ContentNode | ReferenceNode;
export type WidgetRenderStructure = components["schemas"]["RenderContent"];


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

export type CreateBlockTypeRequest = components["schemas"]["CreateBlockTypeRequest"];
export type GetBlockTypesResponse =
    operations["getBlockTypes"]["responses"]["200"]["content"]["*/*"];

/* -------------------------------------------------------------------------- */
/*                                 Type Guards                                */
/* -------------------------------------------------------------------------- */

export const isContentMetadata = (payload: Block["payload"]): payload is BlockContentMetadata =>
    payload?.type === BlockMetadataType.CONTENT;

export const isBlockReferenceMetadata = (
    payload: Block["payload"]
): payload is BlockReferenceMetadata => payload?.type === BlockMetadataType.BLOCK_REFERENCE;
export const isEntityReferenceMetadata = (
    payload: Block["payload"]
): payload is EntityReferenceMetadata => payload?.type === BlockMetadataType.ENTITY_REFERENCE;

export const isContentNode = (node: BlockNode): node is ContentNode =>
    !!node.block && node.type === NodeType.CONTENT;

export const isReferenceNode = (node: BlockNode): node is ReferenceNode =>
    !!node.block && node.type === NodeType.REFERENCE;

/* -------------------------------------------------------------------------- */
