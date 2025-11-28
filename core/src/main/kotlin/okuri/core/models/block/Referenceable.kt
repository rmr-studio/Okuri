package okuri.core.models.block

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.deserializer.ReferenceableDeserializer
import okuri.core.enums.core.EntityType


@Schema(hidden = true)
@JsonDeserialize(using = ReferenceableDeserializer::class)
interface Referenceable {
    val type: EntityType
}