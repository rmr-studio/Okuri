package okuri.core.service.util.factory

import okuri.core.enums.client.ClientType
import okuri.core.models.client.Client
import okuri.core.models.common.Contact
import java.util.*

object ClientFactory {
    fun createClient(
        id: UUID = UUID.randomUUID(),
        organisationId: UUID = UUID.randomUUID(),
        name: String = "Name"
    ): Client {
        return Client(
            id = id,
            organisationId = organisationId,
            name = name,
            contact = Contact(
                email = "email@email.com",
            ),
            type = ClientType.CUSTOMER
        )
    }
}