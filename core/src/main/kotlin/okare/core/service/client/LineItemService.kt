package okare.core.service.client

import io.github.oshai.kotlinlogging.KLogger
import io.ktor.server.plugins.*
import okare.core.entity.invoice.LineItemEntity
import okare.core.entity.invoice.toModel
import okare.core.models.client.request.LineItemCreationRequest
import okare.core.models.invoice.LineItem
import okare.core.repository.client.LineItemRepository
import okare.core.service.auth.AuthTokenService
import okare.core.util.ServiceUtil.findManyResults
import okare.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

@Service
class LineItemService(
    private val repository: LineItemRepository,
    private val authTokenService: AuthTokenService,
    private val logger: KLogger
) {

    @Throws(NotFoundException::class, IllegalArgumentException::class)
    fun getUserLineItems(): List<LineItemEntity> {
        return findManyResults(authTokenService.getUserId(), repository::findByUserId)
    }

    @Throws(NotFoundException::class)
    fun getLineItemById(id: UUID): LineItemEntity {
        return findOrThrow(id, repository::findById)
    }

    fun createLineItem(request: LineItemCreationRequest): LineItem {
        authTokenService.getUserId().let {
            LineItemEntity(
                userId = it,
                name = request.name,
                description = request.description,
                chargeRate = request.chargeRate
            ).run {
                repository.save(this).let { entity ->
                    logger.info { "LineItem Service => User $it => Created new line item with ID: ${entity.id}" }
                    return entity.toModel()
                }
            }
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnLineItem(#lineItem)")
    fun updateLineItem(lineItem: LineItem): LineItem {
        findOrThrow(lineItem.id, repository::findById).apply {
            name = lineItem.name
            description = lineItem.description
            chargeRate = lineItem.chargeRate
        }.run {
            repository.save(this)
            // Todo: Would need to mark Invoices as outdated if the line item charge changes


            logger.info { "LineItem Service => Updated line item with ID: ${this.id}" }
            return this.toModel()
        }
    }

    @PreAuthorize("@securityConditions.doesUserOwnLineItem(#lineItem)")
    fun deleteLineItem(lineItem: LineItem) {
        repository.deleteById(lineItem.id)
        logger.info { "LineItem Service => Deleted line item with ID: ${lineItem.id}" }
    }
}