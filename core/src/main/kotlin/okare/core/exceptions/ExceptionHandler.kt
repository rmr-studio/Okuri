package okare.core.exceptions

import io.github.oshai.kotlinlogging.KLogger
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.authorization.AuthorizationDeniedException
import org.springframework.web.bind.annotation.ControllerAdvice
import org.springframework.web.bind.annotation.ExceptionHandler
import okare.core.configuration.properties.ApplicationConfigurationProperties
import okare.core.models.response.ErrorResponse

@ControllerAdvice
class ExceptionHandler(private val logger: KLogger, private val config: ApplicationConfigurationProperties) {

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDeniedException(ex: AccessDeniedException): ResponseEntity<ErrorResponse> {
        logger.warn { "Access denied: ${ex.message}" }
        return ErrorResponse(
            statusCode = HttpStatus.FORBIDDEN,
            error = "ACCESS DENIED",
            message = ex.message ?: "Access denied",
            stackTrace = config.includeStackTrace.takeIf { it }?.let { ex.stackTraceToString() }
        ).also { logger.error { it } }.let {
            ResponseEntity(it, it.statusCode)
        }
    }

    @ExceptionHandler(AuthorizationDeniedException::class)
    fun handleAuthorizationDenied(ex: AuthorizationDeniedException): ResponseEntity<ErrorResponse> {
        logger.warn { "Access denied: ${ex.message}" }
        return ErrorResponse(
            statusCode = HttpStatus.FORBIDDEN,
            error = "AUTHORIZATION DENIED",
            message = ex.message ?: "Authorisation denied",
            stackTrace = config.includeStackTrace.takeIf { it }?.let { ex.stackTraceToString() }
        ).also { logger.error { it } }.let {
            ResponseEntity(it, it.statusCode)
        }
    }

    @ExceptionHandler(NotFoundException::class)
    fun handleNotFoundException(ex: NotFoundException): ResponseEntity<ErrorResponse> {
        return ErrorResponse(
            statusCode = HttpStatus.NOT_FOUND,
            error = "RESOURCE NOT FOUND",
            message = ex.message ?: "Resource not found",
            stackTrace = config.includeStackTrace.takeIf { it }?.let { ex.stackTraceToString() }
        ).also { logger.error { it } }.let {
            ResponseEntity(it, it.statusCode)
        }
    }

    @ExceptionHandler(IllegalArgumentException::class)
    fun handleIllegalArgumentException(ex: IllegalArgumentException): ResponseEntity<ErrorResponse> {
        return ErrorResponse(
            statusCode = HttpStatus.BAD_REQUEST,
            error = "INVALID ARGUMENT",
            message = ex.message ?: "Invalid argument provided",
            stackTrace = config.includeStackTrace.takeIf { it }?.let { ex.stackTraceToString() }
        ).also { logger.error { it } }.let {
            ResponseEntity(it, it.statusCode)
        }
    }

    @ExceptionHandler(ConflictException::class)
    fun handleConflictException(ex: ConflictException): ResponseEntity<ErrorResponse> {
        return ErrorResponse(
            statusCode = HttpStatus.CONFLICT,
            error = "CONFLICT",
            message = ex.message ?: "Conflict occurred",
            stackTrace = config.includeStackTrace.takeIf { it }?.let { ex.stackTraceToString() }
        ).also { logger.error { it } }.let {
            ResponseEntity(it, it.statusCode)
        }
    }
}