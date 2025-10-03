package okuri.core.models.block.structure

import com.fasterxml.jackson.annotation.JsonInclude
import okuri.core.enums.block.BlockOwnership
import okuri.core.enums.core.EntityType
import okuri.core.models.block.BlockReference
import okuri.core.models.common.json.JsonObject
import okuri.core.models.common.json.JsonValue
import java.io.Serializable
import java.util.*

data class BlockMetadata(
    val data: JsonObject = emptyMap(),
    val refs: List<BlockReference<*>> = emptyList(),
    val meta: BlockMeta
) : Serializable {
    companion object RefJson {
        // Inline reference markers allowed inside `data` at the exact slot of a nested block / entity
        const val REF_TYPE = "_refType"      // e.g., "BLOCK", "CLIENT" (must match EntityType.name)
        const val REF_ID = "_refId"        // UUID string
        const val OWNERSHIP = "_ownership"    // "OWNED" | "LINKED"
        const val SUMMARY = "_summary"      // optional JsonObject snapshot for quick render

        // Helpers to build inline ref nodes (used inside `data`)
        private fun refNode(
            type: EntityType,
            id: UUID,
            ownership: BlockOwnership = BlockOwnership.LINKED,
            summary: JsonObject? = null
        ): JsonObject {
            val base = mutableMapOf<String, JsonValue>(
                REF_TYPE to type.name,
                REF_ID to id.toString(),
                OWNERSHIP to ownership.name
            )
            if (summary != null) base[SUMMARY] = summary
            return base
        }

        fun ownedBlockRefNode(id: UUID, summary: JsonObject? = null): JsonObject =
            refNode(EntityType.BLOCK, id, BlockOwnership.OWNED, summary)

        fun linkedBlockRefNode(id: UUID, summary: JsonObject? = null): JsonObject =
            refNode(EntityType.BLOCK, id, BlockOwnership.LINKED, summary)
    }
}


// ---- Transient/system metadata (not business data) ----
@JsonInclude(JsonInclude.Include.NON_NULL)
data class BlockMeta(
    val validationErrors: List<String> = emptyList(),
    val computedFields: JsonObject? = null,    // optional server-computed values for UI summaries
    val lastValidatedVersion: Int? = null      // BlockType.version used for last validation
)