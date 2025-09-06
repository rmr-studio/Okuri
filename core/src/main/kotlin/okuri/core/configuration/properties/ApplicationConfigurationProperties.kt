package okuri.core.configuration.properties

import jakarta.validation.constraints.NotNull
import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "okuri")
data class ApplicationConfigurationProperties(
    val includeStackTrace: Boolean = true,
    @NotNull
    val supabaseUrl: String,
    @NotNull
    val supabaseKey: String,
    @NotNull
    val webOrigin: String = "http://localhost:3000", // Default to localhost for development purposes
)
