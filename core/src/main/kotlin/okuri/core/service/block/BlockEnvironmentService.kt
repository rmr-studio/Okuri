package okuri.core.service.block

import org.springframework.stereotype.Service

@Service
class BlockEnvironmentService(
    private val blockService: BlockService,
    private val blockTreeLayoutService: BlockTreeLayoutService,
    private val blockReferenceService: BlockReferenceService,
    private val blockChildrenService: BlockChildrenService
) {
    fun saveBlockEnvironment(val request: Save) {}

}