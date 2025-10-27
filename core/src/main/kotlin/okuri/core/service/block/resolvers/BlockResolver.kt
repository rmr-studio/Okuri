package okuri.core.service.block.resolvers

import okuri.core.models.block.BlockTree
import okuri.core.service.block.BlockService
import org.springframework.stereotype.Component
import java.util.*

@Component
class BlockResolver(
    private val blockService: BlockService
) : ReferenceResolver {
    override val type = okuri.core.enums.core.EntityType.BLOCK_TREE

    /**
     * Resolves the given block IDs to their corresponding BlockEntity instances.
     *
     * Only IDs that resolve to existing entities are included in the returned map.
     *
     * @param ids The set of block UUIDs to resolve.
     * @return A map from each resolved UUID to its `BlockEntity`; IDs with no matching entity are omitted.
     */
    override fun fetch(ids: Set<UUID>): Map<UUID, BlockTree> {
        TODO("Not yet implemented")
    }
}