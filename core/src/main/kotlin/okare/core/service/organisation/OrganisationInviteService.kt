package okare.core.service.organisation

import jakarta.transaction.Transactional
import okare.core.entity.organisation.OrganisationInviteEntity
import okare.core.enums.organisation.OrganisationInviteStatus
import okare.core.enums.organisation.OrganisationRoles
import okare.core.exceptions.ConflictException
import okare.core.models.organisation.OrganisationInvite
import okare.core.repository.organisation.OrganisationInviteRepository
import okare.core.repository.organisation.OrganisationMemberRepository
import okare.core.service.auth.AuthTokenService
import okare.core.util.ServiceUtil.findManyResults
import okare.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*


@Service
class OrganisationInviteService(
    private val organisationService: OrganisationService,
    private val organisationInviteRepository: OrganisationInviteRepository,
    private val organisationMemberRepository: OrganisationMemberRepository,
    private val authTokenService: AuthTokenService
) {

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId) and @organisationSecurity.hasOrgRoleOrHigher(#organisationId, 'ADMIN')")
    @Throws(AccessDeniedException::class, IllegalArgumentException::class)
    fun createOrganisationInvitation(organisationId: UUID, email: String, role: OrganisationRoles): OrganisationInvite {
        // Disallow invitation with the Owner role, ensure that this is only down through specified transfer of ownership methods
        if (role == OrganisationRoles.OWNER) {
            throw IllegalArgumentException("Cannot create an invite with the Owner role. Use transfer ownership methods instead.")
        }

        findManyResults(
            organisationId,
            organisationMemberRepository::findByIdOrganisationId
        ).run {
            // Assert that the email is not already a member of the organisation.
            if (this.any {
                    it.user?.email == email
                }) {
                throw ConflictException("User with this email is already a member of the organisation.")
            }
        }

        // Check if there is currently not a pending invite for this email.
        organisationInviteRepository.findByOrganisationIdAndEmailAndInviteStatus(
            organisationId = organisationId,
            email = email,
            inviteStatus = OrganisationInviteStatus.PENDING
        ).run {
            if (this.isNotEmpty()) {
                throw IllegalArgumentException("An invitation for this email already exists.")
            }
        }

        OrganisationInviteEntity(
            organisationId = organisationId,
            email = email,
            role = role,
            inviteStatus = OrganisationInviteStatus.PENDING,
            invitedBy = authTokenService.getUserId(),
        ).let {
            organisationInviteRepository.save(it).run {
                // TODO: Send out invitational email
                return OrganisationInvite.fromEntity(this)
            }
        }
    }

    @Throws(AccessDeniedException::class, IllegalArgumentException::class)
    @Transactional
    fun handleInvitationResponse(token: String, accepted: Boolean) {
        findOrThrow(token, organisationInviteRepository::findByToken).let { invitation ->
            // Assert the user is the one who was invited
            authTokenService.getUserEmail().let {
                if (it != invitation.email) {
                    throw AccessDeniedException("User email does not match the invite email.")
                }
            }

            if (invitation.inviteStatus != OrganisationInviteStatus.PENDING) {
                throw IllegalArgumentException("Cannot respond to an invitation that is not pending.")
            }

            // Handle invitation acceptance - Add user as a member of an organisation
            if (accepted) {
                invitation.apply {
                    inviteStatus = OrganisationInviteStatus.ACCEPTED
                }.run {
                    organisationInviteRepository.save(this)
                    // Add the user to the organisation as a member
                    organisationService.addMemberToOrganisation(
                        organisationId = invitation.organisationId,
                        userId = authTokenService.getUserId(),
                        role = invitation.role
                    )
                    // TODO: Send out acceptance email
                    return
                }
            }

            // Handle invitation rejection - Update the invite status to DECLINED
            invitation.apply {
                inviteStatus = OrganisationInviteStatus.DECLINED
            }.run {
                organisationInviteRepository.save(this)
                // TODO: Send out rejection email
                return
            }
        }
    }

    /**
     * Retrieves a list of invites for the current user, based off value from JWT.
     */
    fun getUserInvites(): List<OrganisationInvite> {
        authTokenService.getUserEmail().let { email ->
            findManyResults(email, organisationInviteRepository::findByEmail).run {
                return this.map { OrganisationInvite.fromEntity(it) }
            }
        }
    }

    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationInvites(organisationId: UUID): List<OrganisationInvite> {
        // Fetch all invites for the organisation
        return findManyResults(organisationId, organisationInviteRepository::findByOrganisationId)
            .map { OrganisationInvite.fromEntity(it) }
    }

    /**
     * Revokes an organisation invite by its ID given the invitation is still in its PENDING state.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId) and @organisationSecurity.hasOrgRoleOrHigher(#organisationId, 'ADMIN')")
    fun revokeOrganisationInvite(organisationId: UUID, id: UUID) {
        // Find the invite by ID
        findOrThrow(id, organisationInviteRepository::findById).let { invite ->
            // Ensure the invite is still pending
            if (invite.inviteStatus != OrganisationInviteStatus.PENDING) {
                throw IllegalArgumentException("Cannot revoke an invitation that is not pending.")
            }

            // Delete invitation
            organisationInviteRepository.deleteById(id)
        }
    }

}