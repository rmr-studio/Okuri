package okuri.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeName
import okuri.core.enums.block.BlockMetadataType
import okuri.core.enums.block.BlockReferenceFetchPolicy

/**
 * Metadata when a block is referencing a list of external entities
 */
@JsonTypeName("entity_reference")
data class EntityReferenceMetadata(
    override val type: BlockMetadataType = BlockMetadataType.ENTITY_REFERENCE,
    override val fetchPolicy: BlockReferenceFetchPolicy = BlockReferenceFetchPolicy.LAZY,
    override val path: String = "\$.items",           // <— used by service to scope rows
    val items: List<ReferenceItem>,
    val presentation: Presentation = Presentation.SUMMARY,
    val projection: Projection? = null,
    val sort: SortSpec? = null,
    val filter: FilterSpec? = null,
    val paging: PagingSpec? = null,
    val allowDuplicates: Boolean = false,          // <— optional guard
    override val meta: BlockMeta = BlockMeta()
) : Metadata, ReferenceMetadata