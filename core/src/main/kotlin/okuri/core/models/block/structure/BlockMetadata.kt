package okuri.core.models.block.structure

import com.fasterxml.jackson.annotation.JsonInclude
import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import io.swagger.v3.oas.annotations.media.Schema
import jakarta.persistence.FetchType
import okuri.core.enums.block.BlockMetadataType
import okuri.core.enums.core.EntityType
import okuri.core.models.common.json.JsonObject
import java.util.*

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "kind")
@JsonSubTypes(
    JsonSubTypes.Type(value = BlockContentMetadata::class, name = "content"),
    JsonSubTypes.Type(value = ReferenceMetadata::class, name = "reference")
)
sealed interface Metadata {
    val kind: BlockMetadataType
    val meta: BlockMeta
}

data class BlockContentMetadata(
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val data: JsonObject = emptyMap(),
    override val kind: BlockMetadataType = BlockMetadataType.CONTENT,
    override val meta: BlockMeta = BlockMeta()
) : Metadata

data class ReferenceMetadata(
    // Lazy v Eager loading for Block Building Operations to save on performance
    val fetchType: FetchType = FetchType.LAZY,
    val items: List<ReferenceItem>,
    override val kind: BlockMetadataType = BlockMetadataType.REFERENCE,
    val presentation: Presentation = Presentation.SUMMARY,
    val projection: Projection? = null,
    val sort: SortSpec? = null,
    val filter: FilterSpec? = null,
    val paging: PagingSpec? = null,
    override val meta: BlockMeta = BlockMeta()
) : Metadata

data class ReferenceItem(
    val type: EntityType,               // CLIENT | COMPANY | BLOCK | ...
    val id: UUID,
    val labelOverride: String? = null,
    val badge: String? = null,
//    val actions: List<ActionRef>? = null
)

enum class Presentation { SUMMARY, ENTITY, TABLE, GRID }

data class Projection(
    val fields: List<String> = emptyList(), // e.g., ["name","domain","contact.email"]
    val templateId: UUID? = null            // optional reusable template
)

data class SortSpec(val by: String, val dir: SortDir = SortDir.ASC)
enum class SortDir { ASC, DESC }
data class FilterSpec(
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val expr: Map<String, Any?> = emptyMap()
)

data class PagingSpec(val pageSize: Int = 20)


// ---- Transient/system metadata (not business data) ----
@JsonInclude(JsonInclude.Include.NON_NULL)
data class BlockMeta(
    val validationErrors: List<String> = emptyList(),
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val computedFields: JsonObject? = null,    // optional server-computed values for UI summaries
    val lastValidatedVersion: Int? = null      // BlockType.version used for last validation
)