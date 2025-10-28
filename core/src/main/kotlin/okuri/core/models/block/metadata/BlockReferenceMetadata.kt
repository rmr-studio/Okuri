package okuri.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeName
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockMetadataType
import okuri.core.enums.block.BlockReferenceFetchPolicy

/**
 * Metadata when a block is referencing an external block.
 */
@JsonTypeName("block_reference")
@Schema(requiredProperties = ["kind", "meta"])
data class BlockReferenceMetadata(
    override val kind: BlockMetadataType = BlockMetadataType.BLOCK_REFERENCE,
    override val fetchPolicy: BlockReferenceFetchPolicy = BlockReferenceFetchPolicy.LAZY,
    override val meta: BlockMeta = BlockMeta(),
    override val path: String = "\$.block",
    val expandDepth: Int = 1,
    val item: ReferenceItem
) : ReferenceMetadata