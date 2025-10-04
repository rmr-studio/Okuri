package okuri.core.service.block.resolvers

import okuri.core.enums.core.EntityType
import okuri.core.models.block.Referenceable
import java.util.*

interface ReferenceResolver {
    val type: EntityType
    fun fetch(ids: Set<UUID>): Map<UUID, Referenceable<*>>
}