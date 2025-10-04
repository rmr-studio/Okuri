package okuri.core.service.block.resolvers

import okuri.core.entity.block.BlockEntity
import org.springframework.stereotype.Component
import java.util.*

@Component
class BlockResolver : ReferenceResolver {
    override val type = okuri.core.enums.core.EntityType.BLOCK
    override fun fetch(ids: Set<UUID>): Map<UUID, BlockEntity> {
        TODO("Not yet implemented")
    }
}