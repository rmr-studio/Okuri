package okuri.core.models.block.request

import okuri.core.models.block.Block
import okuri.core.models.block.BlockReference
import okuri.core.models.block.Referenceable

data class BlockTree(
    val root: Node,
) : Referenceable<BlockTree> {
    // NO-OP for BlockTree
    override fun toReference(): BlockTree {
        return this
    }
}

sealed interface Node {
    val block: Block
    val warnings: List<String>
}

data class ContentNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // All child blocks, given a block and its associated block type supports nesting
    val children: Map<String, List<Node>>? = null,
) : Node

data class ReferenceNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // Allow for lists of entities. But never a list of referenced blocks
    val reference: List<BlockReference<*>>,
) : Node


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
 *     }
 *   }
 * }
 *
 */