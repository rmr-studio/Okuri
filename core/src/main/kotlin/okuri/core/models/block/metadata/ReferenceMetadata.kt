package okuri.core.models.block.metadata

import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.enums.block.BlockReferenceFetchPolicy
import okuri.core.enums.core.EntityType
import java.util.*


@Schema(hidden = true)
sealed interface ReferenceMetadata : Metadata {
    val fetchPolicy: BlockReferenceFetchPolicy
    val path: String
}

data class ReferenceItem(
    val type: EntityType,               // CLIENT | COMPANY | BLOCK | ...
    val id: UUID,
    val labelOverride: String? = null,
    val badge: String? = null,
//    val actions: List<ActionRef>? = null
)

enum class Presentation { SUMMARY, ENTITY, TABLE, GRID, INLINE }

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
