package okuri.core.models.block

interface Referenceable<T> {
    fun toReference(): T
}