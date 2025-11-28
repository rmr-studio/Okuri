package okuri.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeName
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import okuri.core.enums.block.structure.BlockMetadataType
import okuri.core.enums.block.structure.BlockReferenceFetchPolicy

/**
 * Metadata when a block is referencing an external block.
 */
@JsonTypeName("block_reference")
@JsonDeserialize(using = JsonDeserializer.None::class)
data class BlockReferenceMetadata(
    override val type: BlockMetadataType = BlockMetadataType.BLOCK_REFERENCE,
    override val fetchPolicy: BlockReferenceFetchPolicy = BlockReferenceFetchPolicy.LAZY,
    override val deletable: Boolean = true,
    override val meta: BlockMeta = BlockMeta(),
    override val path: String = "\$.block",
    val expandDepth: Int = 1,
    val item: ReferenceItem
) : ReferenceMetadata