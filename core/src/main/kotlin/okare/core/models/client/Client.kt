package okare.core.models.client

import okare.core.entity.client.ClientEntity
import okare.core.models.user.Address
import java.util.*

data class Client(
    val id: UUID,
    val userId: UUID,
    var name: String,
    var address: Address,
    var NDISnumber: String,
    var phone: String
) {
    companion object Factory {
        fun fromEntity(entity: ClientEntity): Client {
            entity.id.let {
                if (it == null) {
                    throw IllegalArgumentException("InvoiceRecipientEntity id cannot be null")
                }

                return Client(
                    id = it,
                    userId = entity.userId,
                    name = entity.name,
                    address = entity.address,
                    NDISnumber = entity.NDISnumber,
                    phone = entity.phone
                )
            }

        }
    }
}