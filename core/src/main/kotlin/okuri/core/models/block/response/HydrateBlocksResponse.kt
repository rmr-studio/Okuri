package okuri.core.models.block.response

import okuri.core.models.block.Reference
import java.util.*

/**
 * Result of hydrating a single block's entity references.
 *
 * @param blockId The UUID of the block that was hydrated.
 * @param references The resolved entity references for this block.
 * @param error Optional error message if hydration failed for this block.
 */
data class BlockHydrationResult(
    val blockId: UUID,
    val references: List<Reference>,
    val error: String? = null
)

/**
 * Response containing hydration results for multiple blocks.
 *
 * The response is a map from block ID to its hydration result.
 * This allows the frontend to easily look up results per block.
 */
typealias HydrateBlocksResponse = Map<UUID, BlockHydrationResult>
