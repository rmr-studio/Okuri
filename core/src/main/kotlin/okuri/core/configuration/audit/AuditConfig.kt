package okuri.core.configuration.audit

import okuri.core.configuration.auth.SecurityAuditorAware
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.data.jpa.repository.config.EnableJpaAuditing

@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
class AuditConfig {

    /**
     * Registers a SecurityAuditorAware bean for JPA auditing.
     *
     * This bean is exposed as "auditorProvider" and supplies the current auditor (user)
     * to Spring Data JPA's auditing infrastructure.
     *
     * @return a SecurityAuditorAware instance used to determine the current auditor.
     */
    @Bean
    fun auditorProvider(): SecurityAuditorAware = SecurityAuditorAware()
}