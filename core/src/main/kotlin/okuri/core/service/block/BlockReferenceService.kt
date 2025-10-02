package okuri.core.service.block

import okuri.core.enums.core.EntityType
import org.springframework.stereotype.Service
import java.util.*

/**
 * Service for managing block references.
 * Inside a block, a reference can be made to attach another Entity (Client, Project, Task, etc.) to the block,
 * or another block (to create a block hierarchy).
 *
 * These references inside the payload as stored as follows:
 * { "_refType": "BLOCK", "_refId": "f9b7d4e2-..." }
 */
@Service
class BlockReferenceService {

    /** Walk payload and collect {_refType, _refId} refs for block_references. */
    fun extractReferences(payload: Any?, path: String = "$"): List<ParsedRef> {
        val out = mutableListOf<ParsedRef>()
        when (payload) {
            is Map<*, *> -> {
                // object ref
                val t = payload["_refType"] as? String
                val id = payload["_refId"] as? String
                if (t != null && id != null) {
                    runCatching { UUID.fromString(id) }.getOrNull()?.let { uuid ->
                        runCatching { EntityType.valueOf(t) }.getOrNull()?.let { et ->
                            out += ParsedRef(et, uuid, path)
                        }
                    }
                }
                // descend
                payload.forEach { (k, v) ->
                    if (k is String) out += extractReferences(v, "$path/$k")
                }
            }

            is List<*> -> payload.forEachIndexed { i, v -> out += extractReferences(v, "$path[$i]") }
        }
        return out
    }
}

data class ParsedRef(val type: EntityType, val id: UUID, val path: String)