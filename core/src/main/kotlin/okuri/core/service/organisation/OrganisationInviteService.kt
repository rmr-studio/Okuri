package okuri.core.service.organisation

import okuri.core.entity.organisation.OrganisationInviteEntity
import okuri.core.entity.organisation.toModel
import okuri.core.enums.activity.Activity
import okuri.core.enums.organisation.OrganisationInviteStatus
import okuri.core.enums.organisation.OrganisationRoles
import okuri.core.enums.util.OperationType
import okuri.core.exceptions.ConflictException
import okuri.core.models.organisation.OrganisationInvite
import okuri.core.repository.organisation.OrganisationInviteRepository
import okuri.core.repository.organisation.OrganisationMemberRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.util.ServiceUtil.findManyResults
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.util.*


@Service
class OrganisationInviteService(
    private val organisationService: OrganisationService,
    private val organisationInviteRepository: OrganisationInviteRepository,
    private val organisationMemberRepository: OrganisationMemberRepository,
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {

    /**
     * Create an invitation for a user to join an organisation with a specified role.
     *
     * @param organisationId The UUID of the organisation to invite the user into.
     * @param email The invitee's email address.
     * @param role The role to assign to the invitee; must not be `OWNER` (use ownership transfer methods for that).
     * @return The created `OrganisationInvite` model representing the persisted invitation.
     * @throws AccessDeniedException if the caller lacks organisation access or sufficient role.
     * @throws IllegalArgumentException if `role` is `OWNER` or a pending invite for the email already exists.
     * @throws ConflictException if the email already belongs to an existing organisation member.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId) and @organisationSecurity.hasOrgRoleOrHigher(#organisationId, 'ADMIN')")
    @Throws(AccessDeniedException::class, IllegalArgumentException::class)
    fun createOrganisationInvitation(organisationId: UUID, email: String, role: OrganisationRoles): OrganisationInvite {

        // Disallow invitation with the Owner role, ensure that this is only down through specified transfer of ownership methods
        if (role == OrganisationRoles.OWNER) {
            throw IllegalArgumentException("Cannot create an invite with the Owner role. Use transfer ownership methods instead.")
        }

        findManyResults {
            organisationMemberRepository.findByIdOrganisationId(organisationId)
        }.run {
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

                activityService.logActivity(
                    activity = Activity.ORGANISATION_MEMBER_INVITE,
                    operation = OperationType.CREATE,
                    userId = authTokenService.getUserId(),
                    organisationId = organisationId,
                    additionalDetails = "Invited $email with role $role to organisation $organisationId => Invite ID: ${this.id}"
                )
                return this.toModel()
            }
        }

    }

    /**
     * Handles a user's response to an organisation invitation identified by its token.
     *
     * Validates that the authenticated user's email matches the invitation email and that the
     * invitation is in the PENDING state, then updates the invitation status to ACCEPTED or
     * DECLINED. If accepted, the authenticated user is added to the organisation with the
     * invitation's role.
     *
     * @param token The invitation token used to locate the invitation.
     * @param accepted `true` to accept the invitation, `false` to decline it.
     * @throws AccessDeniedException if the authenticated user's email does not match the invite email.
     * @throws IllegalArgumentException if the invitation is not in the PENDING state.
     */
    @Throws(AccessDeniedException::class, IllegalArgumentException::class)
    @Transactional
    fun handleInvitationResponse(token: String, accepted: Boolean) {
        findOrThrow { organisationInviteRepository.findByToken(token) }.let { invitation ->
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
     * Returns the organisation invites addressed to the authenticated user.
     *
     * @return A list of `OrganisationInvite` models for the email extracted from the current user's auth token (empty if none).
     */
    fun getUserInvites(): List<OrganisationInvite> {
        authTokenService.getUserEmail().let { email ->
            findManyResults { organisationInviteRepository.findByEmail(email) }.run {
                return this.map { it.toModel() }
            }
        }
    }

    /**
     * Retrieves all organisation invitations for the specified organisation.
     *
     * @param organisationId ID of the organisation whose invites are returned.
     * @return A list of OrganisationInvite models for the organisation; empty if none exist.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationInvites(organisationId: UUID): List<OrganisationInvite> {
        // Fetch all invites for the organisation
        return findManyResults { organisationInviteRepository.findByOrganisationId(organisationId) }
            .map { it.toModel() }
    }

    /**
     * Revoke a pending organisation invitation.
     *
     * Deletes the invitation identified by [id] for the given organisation only if its status is PENDING.
     *
     * @param organisationId The organisation's UUID the invitation belongs to.
     * @param id The UUID of the invitation to revoke.
     * @throws IllegalArgumentException if the invitation exists but is not in the PENDING state.
     */
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId) and @organisationSecurity.hasOrgRoleOrHigher(#organisationId, 'ADMIN')")
    fun revokeOrganisationInvite(organisationId: UUID, id: UUID) {
        // Find the invite by ID
        findOrThrow { organisationInviteRepository.findById(id) }.let { invite ->
            // Ensure the invite is still pending
            if (invite.inviteStatus != OrganisationInviteStatus.PENDING) {
                throw IllegalArgumentException("Cannot revoke an invitation that is not pending.")
            }

            // Delete invitation
            organisationInviteRepository.deleteById(id)
        }
    }

}