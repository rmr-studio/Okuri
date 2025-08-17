package okare.core.configuration.auth

import okare.core.enums.organisation.OrganisationRoles
import okare.core.models.organisation.OrganisationMember
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.oauth2.jwt.Jwt
import org.springframework.stereotype.Component
import java.util.*

@Component
class OrganisationSecurity {
    fun hasOrgRole(organisationId: UUID, role: OrganisationRoles): Boolean {
        val authority: String = "ROLE_${organisationId}_$role"

        SecurityContextHolder.getContext().authentication.let {
            if (it == null || !it.isAuthenticated) {
                return false
            }
            if (it.authorities.isEmpty()) {
                return false
            }

            return it.authorities.any { claim -> claim.authority == authority }
        }


    }

    fun hasOrg(organisationId: UUID): Boolean {
        SecurityContextHolder.getContext().authentication.let {
            if (it == null || !it.isAuthenticated) {
                return false
            }
            if (it.authorities.isEmpty()) {
                return false
            }

            return it.authorities.any { claim -> claim.authority.startsWith("ROLE_$organisationId") }
        }
    }

    fun hasOrgRoleOrHigher(
        organisationId: UUID,
        targetRole: OrganisationRoles
    ): Boolean {
        val claim: String = SecurityContextHolder.getContext().authentication.let {
            if (it == null || !it.isAuthenticated) {
                return false
            }
            if (it.authorities.isEmpty()) {
                return false
            }

            it.authorities.firstOrNull { claim -> claim.authority.startsWith("ROLE_$organisationId") } ?: return false
        }.toString()

        return OrganisationRoles.fromString(claim.removePrefix("ROLE_${organisationId}_")).authority >= targetRole.authority
    }

    fun hasHigherOrgRole(
        organisationId: UUID,
        targetRole: OrganisationRoles
    ): Boolean {
        val claim: String = SecurityContextHolder.getContext().authentication.let {
            if (it == null || !it.isAuthenticated) {
                return false
            }
            if (it.authorities.isEmpty()) {
                return false
            }

            it.authorities.firstOrNull { claim -> claim.authority.startsWith("ROLE_$organisationId") } ?: return false
        }.toString()

        return OrganisationRoles.fromString(claim.removePrefix("ROLE_${organisationId}_")).authority > targetRole.authority
    }

    /**
     * Allow permission to update a current member (ie. Updating role, or membership removal) under the following conditions:
     *  - The user is the owner of the organisation
     *  - The user is an admin and has a role higher than the member's role (ie. ADMIN can alter roles of MEMBER users, but not OWNER or ADMIN)
     */
    fun isUpdatingOrganisationMember(organisationId: UUID, user: OrganisationMember): Boolean {
        return this.hasOrgRole(organisationId, OrganisationRoles.OWNER) ||
                (this.hasOrgRoleOrHigher(organisationId, OrganisationRoles.ADMIN) &&
                        this.hasHigherOrgRole(organisationId, user.role))
    }

    fun isUpdatingSelf(member: OrganisationMember): Boolean {
        return SecurityContextHolder.getContext().authentication.principal.let {
            if (it !is Jwt) {
                return false
            }

            it.claims["sub"]
        } == member.user.id.toString()
    }
}