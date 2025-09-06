package okuri.core.util

import okuri.core.exceptions.NotFoundException
import java.util.*

object ServiceUtil {

    /**
     * Finds an entity by the given query and returns it, or throws NotFoundException if not found.
     */
    @Throws(NotFoundException::class)
    fun <T, V> findOrThrow(data: T, query: (T) -> Optional<V>): V {
        return query.invoke(data)
            .orElseThrow { NotFoundException("Entity not found for query: $data") }
    }

    fun <T, V> findManyResults(data: T, query: (T) -> List<V>): List<V> {
        return query.invoke(data)
    }
}