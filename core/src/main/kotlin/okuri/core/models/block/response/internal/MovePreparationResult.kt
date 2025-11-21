package okuri.core.models.block.response.internal

import okuri.core.entity.block.BlockChildEntity


data class MovePreparationResult(
    val childEntitiesToDelete: List<BlockChildEntity>,
    val childEntitiesToSave: List<BlockChildEntity>
)
