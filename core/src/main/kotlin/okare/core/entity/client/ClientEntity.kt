package okare.core.entity.client

import io.hypersistence.utils.hibernate.type.json.JsonBinaryType
import jakarta.persistence.*
import okare.core.entity.template.TemplateEntity
import okare.core.models.client.Client
import okare.core.models.client.ContactDetails
import okare.core.models.template.client.ClientTemplateFieldStructure
import okare.core.models.template.toModel
import org.hibernate.annotations.Type
import java.time.ZonedDateTime
import java.util.*

@Entity
@Table(
    name = "clients",
    indexes = [
        Index(name = "idx_client_organisation_id", columnList = "organisation_id")
    ]
)
data class ClientEntity(
    @Id
    @GeneratedValue
    @Column(name = "id")
    val id: UUID? = null,

    @Column(name = "organisation_id", nullable = false)
    val organisationId: UUID,

    @Column(name = "name", nullable = false)
    var name: String,

    @Column(name = "contact_details", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    var contactDetails: ContactDetails? = null,

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "template_id", referencedColumnName = "id")
    var template: TemplateEntity<ClientTemplateFieldStructure>? = null, // Link to which template was used for client structure

    @Column(name = "attributes", columnDefinition = "jsonb")
    @Type(JsonBinaryType::class)
    var attributes: Map<String, Any> = emptyMap(), // E.g., {"industry": "Healthcare", "size": "50-100"}

    @Column(
        name = "created_at",
        nullable = false,
        updatable = false
    ) var createdAt: ZonedDateTime = ZonedDateTime.now(),

    @Column(name = "updated_at", nullable = false) var updatedAt: ZonedDateTime = ZonedDateTime.now()
) {
    @PrePersist
    fun onPrePersist() {
        createdAt = ZonedDateTime.now()
        updatedAt = ZonedDateTime.now()
    }

    @PreUpdate
    fun onPreUpdate() {
        updatedAt = ZonedDateTime.now()
    }
}

fun ClientEntity.toModel(): Client {
    this.id.let {
        if (it == null) {
            throw IllegalStateException("ClientEntity ID cannot be null when converting to model")
        }

        return Client(
            id = it,
            organisationId = this.organisationId,
            template = this.template?.toModel(),
            name = this.name,
            contactDetails = this.contactDetails,
            attributes = this.attributes
        )

    }

}