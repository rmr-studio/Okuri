package okuri.core.models.block.operation

import com.fasterxml.jackson.databind.annotation.JsonDeserialize
import io.swagger.v3.oas.annotations.media.Schema
import okuri.core.deserializer.BlockOperationDeserializer
import okuri.core.enums.block.request.BlockOperationType
import java.util.*

@Schema(hidden = true)
@JsonDeserialize(using = BlockOperationDeserializer::class)
sealed interface BlockOperation {
    val type: BlockOperationType
    val blockId: UUID
}