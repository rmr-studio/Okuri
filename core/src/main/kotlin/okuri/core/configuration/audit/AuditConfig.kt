package okuri.core.configuration.audit

import okuri.core.configuration.auth.SecurityAuditorAware
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
class AuditConfig {

    @Bean
    fun auditorProvider(): SecurityAuditorAware = SecurityAuditorAware()
}