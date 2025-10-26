
## Block Tree — Compact Spec
Purpose

A Block Tree represents a hierarchical, schema-driven content graph where:

Blocks are reusable typed units (payload + metadata).

Edges are either OWNED (true parent→child) or LINKED (non-owning references).

The tree is returned already grouped for rendering and editing.

Core Types (conceptual)

Block: { id, organisationId, type, payload, archived }

BlockType: versioned descriptor { key, version, schema, display }

Payload:

data: business JSON (may contain inline ref markers)

refs: flat index of extracted references (read-only)

meta: non-business info (validation errors, lastValidatedVersion)

BlockTree: { maxDepth, expandRefs, root: BlockNode }

BlockNode: { block, children: Map<slot, BlockNode[]>, references: Map<slot, RefRow[]>, warnings? }

RefRow: { id, entityType, entityId, ownership, path, blockId, orderIndex?, entity? }

Inline Ref Marker (inside payload.data)
{ "_refType": "BLOCK|CLIENT|...", "_refId": "<uuid>", "_ownership": "OWNED|LINKED" }


Used only as a marker at the exact slot in data.

Server extracts these into payload.refs and populates children/references.

Grouping Rules (server output)

OWNED + entityType == BLOCK → children[slot] = BlockNode[]

LINKED (any entityType, including BLOCK) → references[slot] = RefRow[]

payload.refs = flat index (read-only); do not render from it.

Slot derivation: from path (e.g., $.data/addresses[0] → addresses).

Rendering Contract

Owned (embedded): render children[slot] recursively (editable inline).

Linked (related): render references[slot] as summary chips/cards; edit at source.

Bindings in BlockRenderStructure:

DataPath("/data/...") → read/write this block’s payload.data

RefSlot("slot", "INLINE") → children[slot] (owned child nodes)

RefSlot("slot", "SUMMARY") → references[slot] (linked summaries)

Minimal render loop for a node:

Render node.block per BlockType.display.

Apply bindings (data paths, ref slots).

For each children[slot], render embedded nodes.

For each references[slot], render summaries with navigation.

Editing Rules (SoT)

/data/* bindings → PATCH Block (partial deep-merge), re-validate, delta-upsert refs.

/entity/fields/* bindings → PATCH Entity, then refresh relevant blocks.

OWNED children → editable inline.

LINKED refs → not editable inline; navigate to source.

Do not mutate payload.refs in clients.

Validation & Mode

STRICT: invalid → error, reject write.

SOFT: invalid → warnings in payload.meta.validationErrors (non-blocking badge).

Depth, Cycles, Hydration

Response carries { maxDepth, expandRefs }; respect it.

Server prevents OWNED cycles when setting parent; may return cycle warnings.

Linked summaries may include RefRow.entity; otherwise show placeholder and/or “open source”.

Versioning

Blocks are pinned to BlockType.version at creation.

payload.meta.lastValidatedVersion records last validation; show “upgrade available” if type has newer version (non-blocking).

Persistence & Diff (server-side)

On create/update:

Validate payload against BlockType.schema (STRICT/SOFT).

Extract references from payload.data.

Delta-upsert block_references by (blockId, entityType, entityId, path, orderIndex).

For OWNED BLOCK refs, assign parent_id (guard cycles, org).

entity_blocks maps entities to top-level blocks (page composition).

Paths & Ordering

path uses JSONPath/Pointer hybrid (e.g., $.data/contacts[1]).

orderIndex preserves array order for OWNED children; server emits ordered arrays under children[slot].

Security & Tenancy

All blocks and refs are org-scoped; cross-org OWNED is forbidden.

Server should pre-filter trees by caller’s permissions (preferred) or include visibility hints.

Failure Modes

Missing types/components → render a fallback block (safe boundary).

Validation warnings (SOFT) → small badge; do not block page.

Depth exceeded or cycle detected → include warnings on the node.

## Sample BlockNode Payload

/**
 * Example Payload
 *
 * {
 *   "maxDepth": 2,
 *   "expandRefs": true,
 *   "root": {
 *     "block": {
 *       "id": "4b0a...",
 *       "type": { "key": "company_profile", "version": 1, ... },
 *       "payload": {
 *         "data": { "name": "Acme Co", "primaryAddress": {"_refType":"BLOCK","_refId":"c9f9..."}, "contacts":[...] },
 *         "refs": [
 *           { "id": "r1", "entityType": "BLOCK",  "entityId":"c9f9...", "ownership":"OWNED",  "path":"$.data/primaryAddress", "blockId":"4b0a..." },
 *           { "id": "r2", "entityType": "CLIENT", "entityId":"e1a2...", "ownership":"LINKED", "path":"$.data/primaryAddress/_client", "blockId":"4b0a...", "entity": { "id": "e1a2...", "name": "Acme Pty Ltd", ... } }
 *         ],
 *         "meta": { "validationErrors": [], "lastValidatedVersion": 1 }
 *       }
 *     },
 *     "children": {
 *       "primaryAddress": [
 *         {
 *           "block": { "id": "c9f9...", "type": {"key":"address"}, "payload": { "data": {...}, "refs": [...], "meta": {...} } },
 *           "children": {},
 *           "references": {}
 *         }
 *       ],
 *       "contacts": [
 *         { "block": { "...": "..." }, "children": {}, "references": {} }
 *       ]
 *     },
 *     "references": {
 *       "primaryAddress": [
 *         { "entityType": "CLIENT", "entityId":"e1a2...", "entity": { "id":"e1a2...", "name":"Acme Pty Ltd"} }
 *       ]
 *     }
 *   }
 * }

 