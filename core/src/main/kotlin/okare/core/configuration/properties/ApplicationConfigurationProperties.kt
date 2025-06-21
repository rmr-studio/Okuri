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

    @NotNull
    val webOrigin: String = "http://localhost:3000", // Default to localhost for development purposes

    @NotNull
    val profile: String = "development", // Default profile for development purposes
)
