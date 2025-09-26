package okuri.core.service.block

import okuri.core.repository.block.BlockReferenceRepository
import okuri.core.repository.block.BlockRepository
import okuri.core.repository.block.BlockTypeRepository
import okuri.core.repository.block.EntityBlockReferenceRepository
import org.springframework.stereotype.Service

@Service
class BlockService(
    private val blockRepository: BlockRepository,
    private val blockReferenceRepository: BlockReferenceRepository,
    private val blockTypeRepository: BlockTypeRepository,
    private val entityBlockReferenceRepository: EntityBlockReferenceRepository
)