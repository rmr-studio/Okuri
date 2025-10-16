package okuri.core.models.block.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import okuri.core.models.common.json.JsonObject
import java.util.*

/**
 * Request to create a new block.
 * Either typeId or typeKey must be provided to identify the block type.
 */
data class CreateBlockRequest(
    val typeId: UUID? = null,
    val typeKey: String? = null,
    @field:NotNull
    val organisationId: UUID,
    val typeVersion: Int? = null,
    val name: String?,
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    @field:NotEmpty
    val payload: JsonObject
) {
    init {
        require(typeId != null || typeKey != null) { "Either typeId or typeKey must be provided" }
    }
}