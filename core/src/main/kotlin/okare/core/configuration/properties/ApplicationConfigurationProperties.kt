package okare.core.configuration.properties

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "okare")
data class ApplicationConfigurationProperties(
    val includeStackTrace: Boolean = true,
)
