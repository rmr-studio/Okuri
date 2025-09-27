package okuri.core.service.block

import okuri.core.repository.block.BlockRepository
import org.springframework.stereotype.Service

/**
 * Service layer for managing blocks within the application.
 */
@Service
class BlockService(
    private val blockRepository: BlockRepository,
)