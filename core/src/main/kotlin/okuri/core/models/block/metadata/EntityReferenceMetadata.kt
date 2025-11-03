package okuri.core.models.block.metadata

import com.fasterxml.jackson.annotation.JsonTypeName
import okuri.core.enums.block.BlockMetadataType
import okuri.core.enums.block.BlockReferenceFetchPolicy
import okuri.core.enums.core.EntityType

/**
 * Metadata when a block is referencing a list of external entities
 */
@JsonTypeName("entity_reference")
data class EntityReferenceMetadata(
    override val type: BlockMetadataType = BlockMetadataType.ENTITY_REFERENCE,
    override val fetchPolicy: BlockReferenceFetchPolicy = BlockReferenceFetchPolicy.LAZY,
    override val path: String = "\$.items",           // <— used by service to scope rows
    // How the referenced entities should be presented
    val presentation: Presentation = Presentation.SUMMARY,
    val items: List<ReferenceItem>,
    val projection: Projection = Projection(),
    override val allowedTypes: List<EntityType>? = null,
    override val display: ListDisplayConfig = ListDisplayConfig(),
    override val order: OrderingConfig = OrderingConfig(),
    override val allowDuplicates: Boolean = false,          // <— optional guard
    override val meta: BlockMeta = BlockMeta()
) : ReferenceMetadata, ListMetadata<EntityType>