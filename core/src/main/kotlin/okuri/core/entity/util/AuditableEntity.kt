package okuri.core.entity.util

import jakarta.persistence.Column
import jakarta.persistence.EntityListeners
import jakarta.persistence.MappedSuperclass
import jakarta.persistence.PrePersist
import org.springframework.data.annotation.CreatedBy
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedBy
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.ZonedDateTime
import java.util.*

@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class AuditableEntity {

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    var createdAt: ZonedDateTime? = null

    @LastModifiedDate
    @Column(name = "updated_at")
    var updatedAt: ZonedDateTime? = null

    @CreatedBy
    @Column(name = "created_by", updatable = false, columnDefinition = "uuid")
    var createdBy: UUID? = null

    @LastModifiedBy
    @Column(name = "updated_by", columnDefinition = "uuid")
    var updatedBy: UUID? = null

    @PrePersist
    fun prePersist() {
        if (createdAt != null) return
        createdAt = ZonedDateTime.now()
    }
}

abstract class AuditableModel {
    abstract val createdAt: ZonedDateTime?
    abstract val updatedAt: ZonedDateTime?
    abstract val createdBy: UUID?
    abstract val updatedBy: UUID?
}