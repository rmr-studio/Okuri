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

        /**
         * Builds a JsonObject representing an inline reference node for a referenced entity or block.
         *
         * @param type The EntityType of the referenced entity; stored under the `_refType` key as its name.
         * @param id The UUID of the referenced entity; stored under the `_refId` key as a string.
         * @param ownership The BlockOwnership of the reference; stored under the `_ownership` key. Defaults to `LINKED`.
         * @param summary Optional JsonObject snapshot to include under the `_summary` key for quick rendering.
         * @return A JsonObject containing `_refType`, `_refId`, `_ownership`, and, if provided, `_summary`.
         */
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

        /**
         * Builds an inline reference JsonObject for an owned block.
         *
         * @param id UUID of the referenced block.
         * @param summary Optional snapshot JsonObject for quick rendering; included under the `_summary` key when provided.
         * @return A JsonObject containing `_refType` set to the block type, `_refId` set to the block UUID, `_ownership` set to `"OWNED"`, and `_summary` when `summary` is provided.
         */
        fun ownedBlockRefNode(id: UUID, summary: JsonObject? = null): JsonObject =
            refNode(EntityType.BLOCK, id, BlockOwnership.OWNED, summary)

        /**
         * Creates a JSON reference node for a linked block.
         *
         * The produced object contains the reference type, reference id, and ownership marker,
         * and includes an optional summary snapshot when provided.
         *
         * @param id The UUID of the referenced block.
         * @param summary Optional JSON snapshot of the referenced block for quick rendering.
         * @return A JsonObject representing the inline reference node (contains REF_TYPE, REF_ID, OWNERSHIP, and optionally SUMMARY).
         */
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