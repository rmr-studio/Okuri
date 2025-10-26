package okuri.core.service.block

import okuri.core.entity.block.BlockReferenceEntity
import org.springframework.stereotype.Service
import java.util.*

@Service
class BlockChildrenService {

    /**
     * Retrieve blocks owned by the specified block, grouped by slot key.
     *
     * @return A map from slot key to a list of BlockReferenceEntity representing the block's owned BLOCK references, ordered by path then order index.
     */
    fun findOwnedBlocks(blockId: UUID): Map<String, List<BlockReferenceEntity>> {
        return blockReferenceRepository.findChildBlocks(
            blockId,
        ).groupBy { slotKeyFromPath(it.path) }
    }

}