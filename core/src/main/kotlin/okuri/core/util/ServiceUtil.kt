package okuri.core.util

import okuri.core.exceptions.NotFoundException
import java.util.*

object ServiceUtil {

    @Throws(NotFoundException::class)
    fun <V> findOrThrow(query: () -> Optional<V>): V =
        query.invoke().orElseThrow { NotFoundException("Entity not found") }
    
    fun <V> findManyResults(query: () -> List<V>): List<V> =
        query.invoke()
}
