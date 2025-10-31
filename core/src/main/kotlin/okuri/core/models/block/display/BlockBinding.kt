package okuri.core.models.block.display

import com.fasterxml.jackson.annotation.JsonSubTypes
import com.fasterxml.jackson.annotation.JsonTypeInfo
import java.io.Serializable

/** Map a data source to a component prop */
data class BlockBinding(
    val prop: String,      // e.g. "title.text", "rows" (dot-path into props)
    val source: BindingSource
) : Serializable

/** Data sources: raw block data, references by slot, or computed expr (reserved) */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes(
    JsonSubTypes.Type(BindingSource.DataPath::class, name = "DataPath"),
    JsonSubTypes.Type(BindingSource.RefSlot::class, name = "RefSlot"),
    JsonSubTypes.Type(BindingSource.Computed::class, name = "Computed")
)
sealed class BindingSource : Serializable {
    data class DataPath(val path: String) : BindingSource()   // $.data/name, $.data/contacts[0]/email
    data class RefSlot(
        val slot: String,                                     // e.g. "contacts" (server groups refs by slotKey)
        val presentation: RefPresentation = RefPresentation.SUMMARY, // SUMMARY|INLINE
        val fields: List<String>? = null,                     // which ref entity fields to project (for SUMMARY or LINKED)
        val expandDepth: Int? = null                          // optional override for inline owned trees
    ) : BindingSource()

    data class Computed(val expr: String, val engine: String = "expr-v1") : BindingSource() // reserved for later
}

enum class RefPresentation { SUMMARY, INLINE }
