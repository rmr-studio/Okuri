package okuri.core.models.block.request

import okuri.core.models.block.Block
import okuri.core.models.block.BlockReference

data class BlockTree(
    val maxDepth: Int = 1,
    val expandRefs: Boolean = false,
    val root: BlockNode,
)

data class BlockNode(
    val block: Block,
    /** key = logical edge (e.g., "contacts", "lineItems") -> many children */
    val children: Map<String, List<BlockNode>> = emptyMap(),
    val references: Map<String, List<BlockReference<*>>> = emptyMap(),
    /** warnings such as missing targets, cycle stubs, etc. */
    val warnings: List<String> = emptyList()
)

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
 *           "links": {}
 *         }
 *       ],
 *       "contacts": [
 *         { "block": { "...": "..." }, "children": {}, "links": {} }
 *       ]
 *     },
 *     "links": {
 *       "primaryAddress": [
 *         { "entityType": "CLIENT", "entityId":"e1a2...", "entity": { "id":"e1a2...", "name":"Acme Pty Ltd"} }
 *       ]
 *     }
 *   }
 * }
 *
 */