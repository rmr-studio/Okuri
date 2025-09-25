package okuri.core.repository.block

import okuri.core.entity.block.BlockEntity
import org.springframework.data.jpa.repository.JpaRepository
import java.util.*

interface BlockRepository : JpaRepository<BlockEntity, UUID>