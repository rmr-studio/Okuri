package okare.core.configuration

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.serializer.JacksonSerializer
import io.github.jan.supabase.storage.Storage
import okare.core.configuration.properties.ApplicationConfigurationProperties
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SupabaseConfiguration(private val config: ApplicationConfigurationProperties) {
    @Bean
    fun supabaseClient(): SupabaseClient {
        return createSupabaseClient(
            supabaseUrl = config.supabaseURL,
            supabaseKey = config.supabaseKey
        ) {
            install(Auth)
            install(Storage)
            defaultSerializer = JacksonSerializer()
        }
    }
}