import { components, operations } from "@/lib/types/types";

// Core block models
export type Block = components["schemas"]["Block"];
export type BlockNode = components["schemas"]["BlockNode"];
export type BlockTree = components["schemas"]["BlockTree"];
export type BlockType = components["schemas"]["BlockType"];
export type BlockSchema = components["schemas"]["BlockSchema"];
export type BlockDisplay = components["schemas"]["BlockDisplay"];
export type BlockMetadata = components["schemas"]["BlockMetadata"];
export type BlockBinding = components["schemas"]["BlockBinding"];
export type BlockComponentNode = components["schemas"]["BlockComponentNode"];
export type ComponentType = components["schemas"]["BlockComponentNode"]["type"];
export type BlockReference = components["schemas"]["BlockReferenceObject"];
export type BlockMeta = components["schemas"]["BlockMeta"];
export type BlockRenderStructure = components["schemas"]["BlockRenderStructure"];
export type BlockFormStructure = components["schemas"]["BlockFormStructure"];
export type BlockTypeNesting = components["schemas"]["BlockType"]["nesting"];

// Requests / Responses (where helpful)
export type CreateBlockRequest = components["schemas"]["CreateBlockRequest"];
export type CreateBlockTypeRequest = components["schemas"]["CreateBlockTypeRequest"];

// Controller operation types (convenience re-exports)
export type GetBlockResponse = operations["getBlock"]["responses"]["200"]["content"]["*/*"];
export type GetBlockTypesResponse =
    operations["getBlockTypes"]["responses"]["200"]["content"]["*/*"];

// Add other block-related operation types as needed by the app

export * from "@/lib/interfaces/common.interface";
