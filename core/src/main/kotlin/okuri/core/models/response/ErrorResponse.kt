package okuri.core.models.response

import org.springframework.http.HttpStatus

data class ErrorResponse(
    val statusCode: HttpStatus,
    val message: String,
    val error: String,
    var stackTrace: String? = null
)
