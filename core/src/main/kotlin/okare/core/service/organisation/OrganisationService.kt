package okare.core.service.organisation

import io.github.oshai.kotlinlogging.KLogger
import jakarta.transaction.Transactional
import okare.core.entity.organisation.OrganisationEntity
import okare.core.entity.organisation.OrganisationMemberEntity
import okare.core.entity.organisation.toModel
import okare.core.entity.user.toModel
import okare.core.enums.organisation.OrganisationRoles
import okare.core.exceptions.NotFoundException
import okare.core.models.organisation.Organisation
import okare.core.models.organisation.OrganisationMember
import okare.core.models.organisation.request.OrganisationCreationRequest
import okare.core.repository.organisation.OrganisationMemberRepository
import okare.core.repository.organisation.OrganisationRepository
import okare.core.service.auth.AuthTokenService
import okare.core.service.user.UserService
import okare.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import java.util.*

@Service
class OrganisationService(
    private val organisationRepository: OrganisationRepository,
    private val organisationMemberRepository: OrganisationMemberRepository,
    private val userService: UserService,
    private val logger: KLogger,
    private val authTokenService: AuthTokenService
) {


    @Throws(NotFoundException::class)
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisation(organisationId: UUID, includeMembers: Boolean = false): Organisation {
        return findOrThrow(organisationId, organisationRepository::findById).toModel(includeMembers)
    }

    /**
     * Transactional given our createOrganisation method creates both an Organisation and its first member.
     */
    @Throws(AccessDeniedException::class, IllegalArgumentException::class)
    @Transactional
    fun createOrganisation(request: OrganisationCreationRequest): Organisation {
        val (name, avatarUrl, isDefault) = request
        // Gets the user ID from the auth token to act as the Organisation creator
        val userId: UUID = authTokenService.getUserId()

        // Create and save the organisation entity
        val organisation: Organisation = OrganisationEntity(
            name = name,
            avatarUrl = avatarUrl,
            businessNumber = request.businessNumber,
            address = request.address,
            taxId = request.taxId,
            organisationPaymentDetails = request.payment,
            customAttributes = request.customAttributes,
        ).run {
            organisationRepository.save(this).toModel()
        }

        // Add the creator as the first member/owner of the organisation
        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisation.id,
            userId = userId
        )

        OrganisationMemberEntity(key, OrganisationRoles.OWNER).run {
            organisationMemberRepository.save(this)
        }

        // If this is the first organisation for the user, update their profile to make it their default

        userService.getUserFromSession().toModel().let {
            // Membership array should be empty until transaction is over. Meaning we can determine if this is the first organisation made by the user
            // Can also manually specify for the organisation to become the new default
            if (it.memberships.isEmpty() || isDefault) {
                it.apply {
                    defaultOrganisation = organisation
                }.run {
                    userService.updateUserDetails(this)
                }
            }
        }

        return organisation
    }

    @PreAuthorize("@organisationSecurity.hasOrgRoleOrHigher(#organisation.id, 'ADMIN')")
    fun updateOrganisation(organisation: Organisation): Organisation {
        findOrThrow(organisation.id, organisationRepository::findById).run {
            val entity = this.apply {
                avatarUrl = organisation.avatarUrl
                name = organisation.name
                businessNumber = organisation.businessNumber
                address = organisation.address
                taxId = organisation.taxId
                organisationPaymentDetails = organisation.organisationPaymentDetails
                customAttributes = organisation.customAttributes
            }

            organisationRepository.save(entity).let { updatedEntity ->
                logger.info { "Organisation with ID ${organisation.id} updated successfully." }
                return updatedEntity.toModel()
            }


        }
    }

    /**
     * Transactional given the need to delete all members associated with the organisation before deleting the organisation itself.
     */
    @PreAuthorize("@organisationSecurity.hasOrgRoleOrHigher(#organisationId, 'OWNER')")
    @Transactional
    fun deleteOrganisation(organisationId: UUID) {
        // Check if the organisation exists
        val organisation: OrganisationEntity = findOrThrow(organisationId, organisationRepository::findById)

        // Delete all members associated with the organisation
        organisationMemberRepository.deleteByIdOrganisationId(organisationId)

        // Delete the organisation itself
        organisationRepository.delete(organisation)

        logger.info { "Organisation with ID $organisationId deleted successfully." }
    }

    /**
     * Invoked from Invitation accept action. Users cannot directly add others to an organisation.
     */
    fun addMemberToOrganisation(organisationId: UUID, userId: UUID, role: OrganisationRoles): OrganisationMember {
        // Create and save the new member entity
        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId,
            userId = userId
        )

        return OrganisationMemberEntity(key, role).run {
            organisationMemberRepository.save(this).let { entity ->
                OrganisationMember.fromEntity(entity)
            }.also {
                logger.info { "User with ID $userId added to organisation $organisationId with role $role." }
            }
        }
    }

    /**
     * Allow permission to remove member from organisation under the following conditions:
     *  - The user is the owner of the organisation
     *  - The user is an admin and has a role higher than the member's role (ie. ADMIN can remove MEMBER, but not OWNER or ADMIN)
     *  - The user is trying to remove themselves from the organisation
     */
    @PreAuthorize(
        """
           @organisationSecurity.isUpdatingOrganisationMember(#organisationId, #member) or @organisationSecurity.isUpdatingSelf(#member)
        """
    )
    fun removeMemberFromOrganisation(organisationId: UUID, member: OrganisationMember) {
        // Assert that the removed member is not currently the owner of the organisation
        if (member.role == OrganisationRoles.OWNER) {
            throw IllegalArgumentException("Cannot remove the owner of the organisation. Please transfer ownership first.")
        }

        OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId,
            userId = member.user.id
        ).run {
            findOrThrow(this, organisationMemberRepository::findById)
            organisationMemberRepository.deleteById(this)
            logger.info { "Member with ID ${member.user.id} removed from organisation $organisationId successfully." }
        }
    }

    /**
     * Allow permission to update a member's role in the organisation under the following conditions:
     *  - The user is the owner of the organisation
     *  - The user is an admin and has a role higher than the member's role (ie. ADMIN can alter roles of MEMBER users, but not OWNER or ADMIN)
     */
    @PreAuthorize(
        """
        @organisationSecurity.isUpdatingOrganisationMember(#organisationId, #member)
        """
    )
    fun updateMemberRole(
        organisationId: UUID,
        member: OrganisationMember,
        role: OrganisationRoles
    ): OrganisationMember {

        // Ensure that if the new role is that of OWNER, that only the current owner can assign it
        if (role == OrganisationRoles.OWNER || member.role == OrganisationRoles.OWNER) {
            throw IllegalArgumentException("Transfer of ownership must be done through a dedicated transfer ownership method.")
        }

        OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId,
            userId = member.user.id
        ).run {
            findOrThrow(this, organisationMemberRepository::findById).run {
                this.apply {
                    this.role = role
                }

                organisationMemberRepository.save(this)
                logger.info { "Member with ID ${member.user.id} role updated to $role in organisation $organisationId successfully." }
                return OrganisationMember.fromEntity(this)
            }
        }
    }
}