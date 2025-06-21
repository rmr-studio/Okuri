package okare.core.configuration.properties

import jakarta.validation.constraints.NotNull
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "okare")
data class ApplicationConfigurationProperties(
    val includeStackTrace: Boolean = true,
    @NotNull
    val supabaseURL: String,
    @NotNull
    val supabaseKey: String,
)
