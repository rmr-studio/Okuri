package okuri.core.service.block.resolvers

import okuri.core.entity.block.BlockEntity
import org.springframework.stereotype.Component
import java.util.*

@Component
class BlockResolver : ReferenceResolver {
    override val type = okuri.core.enums.core.EntityType.BLOCK
    /**
     * Resolves the given block IDs to their corresponding BlockEntity instances.
     *
     * Only IDs that resolve to existing entities are included in the returned map.
     *
     * @param ids The set of block UUIDs to resolve.
     * @return A map from each resolved UUID to its `BlockEntity`; IDs with no matching entity are omitted.
     */
    override fun fetch(ids: Set<UUID>): Map<UUID, BlockEntity> {
        TODO("Not yet implemented")
    }
}