package okuri.core.models.block.request

import okuri.core.models.block.layout.TreeLayout

data class SaveLayoutSnapshotRequest(
    val layoutId: String,
    val layout: TreeLayout,
    val version: Int,
    val operations: List<StructuralOperationRequest>,
    val force: Boolean = false,
)