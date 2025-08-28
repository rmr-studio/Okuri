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
import okare.core.service.activity.ActivityService
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
    private val authTokenService: AuthTokenService,
    private val activityService: ActivityService
) {


    /**
     * This will fetch an organisation by its ID, and optionally include its members.
     */
    @Throws(NotFoundException::class)
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisation(organisationId: UUID, includeMembers: Boolean = false): Organisation {
        return getOrganisationEntity(organisationId).toModel(includeMembers)
    }

    @Throws(NotFoundException::class)
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationEntity(organisationId: UUID): OrganisationEntity {
        return findOrThrow(organisationId, organisationRepository::findById)
    }

    /**
     * Transactional given our createOrganisation method creates both an Organisation and its first member.
     */
    @Throws(AccessDeniedException::class, IllegalArgumentException::class)
    @Transactional
    fun createOrganisation(request: OrganisationCreationRequest): Organisation {
        // Gets the user ID from the auth token to act as the Organisation creator
        authTokenService.getUserId().let { userId ->
            // Create and save the organisation entity
            val currency: Currency = try {
                Currency.getInstance(request.defaultCurrency.trim().uppercase())
            } catch (e: IllegalArgumentException) {
                throw IllegalArgumentException("Invalid currency code: ${request.defaultCurrency}")
            }

            val entity = OrganisationEntity(
                name = request.name,
                avatarUrl = request.avatarUrl,
                plan = request.plan,
                defaultCurrency = currency,
                businessNumber = request.businessNumber,
                address = request.address,
                taxId = request.taxId,
                organisationPaymentDetails = request.payment,
                customAttributes = request.customAttributes,
            )
            organisationRepository.save(entity).run {
                val organisation = this.toModel(includeMembers = false)
                organisation.run {
                    // Log the activity of creating an organisation
                    activityService.logActivity(
                        activity = okare.core.enums.activity.Activity.ORGANISATION,
                        operation = okare.core.enums.util.OperationType.CREATE,
                        userId = userId,
                        organisationId = this.id,
                        additionalDetails = "Created organisation with name: $name"
                    )

                    // Add the creator as the first member/owner of the organisation
                    val key = OrganisationMemberEntity.OrganisationMemberKey(
                        organisationId = this.id,
                        userId = userId
                    )

                    OrganisationMemberEntity(key, OrganisationRoles.OWNER).run {
                        organisationMemberRepository.save(this)
                    }

                    // If this is the first organisation for the user, update their profile to make it their default
                    userService.getUserFromSession().toModel().let {
                        // Membership array should be empty until transaction is over. Meaning we can determine if this is the first organisation made by the user
                        // Can also manually specify for the organisation to become the new default
                        if (it.memberships.isEmpty() || request.isDefault) {
                            it.apply {
                                defaultOrganisation = organisation
                            }.run {
                                userService.updateUserDetails(this)
                            }
                        }
                    }

                    return this
                }

            }
        }

    }

    @PreAuthorize("@organisationSecurity.hasOrgRoleOrHigher(#organisation.id, 'ADMIN')")
    fun updateOrganisation(organisation: Organisation): Organisation {
        authTokenService.getUserId().let { userId ->
            findOrThrow(organisation.id, organisationRepository::findById).run {
                val entity = this.apply {
                    avatarUrl = organisation.avatarUrl
                    name = organisation.name
                    businessNumber = organisation.businessNumber
                    address = organisation.address
                    taxId = organisation.taxId
                    organisationPaymentDetails = organisation.organisationPaymentDetails
                    customAttributes = organisation.customAttributes
                    tileLayout = organisation.tileLayout
                }

                organisationRepository.save(entity).let { updatedEntity ->
                    // Log the activity of updating an organisation
                    activityService.logActivity(
                        activity = okare.core.enums.activity.Activity.ORGANISATION,
                        operation = okare.core.enums.util.OperationType.UPDATE,
                        userId = userId,
                        organisationId = updatedEntity.id,
                        additionalDetails = "Updated organisation with name: ${updatedEntity.name}"
                    )
                    return updatedEntity.toModel()
                }
            }
        }
    }

    /**
     * Transactional given the need to delete all members associated with the organisation before deleting the organisation itself.
     */
    @PreAuthorize("@organisationSecurity.hasOrgRoleOrHigher(#organisationId, 'OWNER')")
    @Transactional
    fun deleteOrganisation(organisationId: UUID) {
        authTokenService.getUserId().let { userId ->


            // Check if the organisation exists
            val organisation: OrganisationEntity = findOrThrow(organisationId, organisationRepository::findById)

            // Delete all members associated with the organisation
            organisationMemberRepository.deleteByIdOrganisationId(organisationId)

            // Delete the organisation itself
            organisationRepository.delete(organisation).run {
                // Log the activity of deleting an organisation
                activityService.logActivity(
                    activity = okare.core.enums.activity.Activity.ORGANISATION,
                    operation = okare.core.enums.util.OperationType.DELETE,
                    userId = userId,
                    organisationId = organisationId,
                    additionalDetails = "Deleted organisation with name: ${organisation.name}"
                )

            }
        }
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
                entity.toModel()
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
        authTokenService.getUserId().let { userId ->

            // Assert that the removed member is not currently the owner of the organisation
            if (member.membershipDetails.role == OrganisationRoles.OWNER) {
                throw IllegalArgumentException("Cannot remove the owner of the organisation. Please transfer ownership first.")
            }

            OrganisationMemberEntity.OrganisationMemberKey(
                organisationId = organisationId,
                userId = member.user.id
            ).run {
                findOrThrow(this, organisationMemberRepository::findById)
                organisationMemberRepository.deleteById(this)
                activityService.logActivity(
                    activity = okare.core.enums.activity.Activity.ORGANISATION_MEMBER,
                    operation = okare.core.enums.util.OperationType.DELETE,
                    userId = userId,
                    organisationId = organisationId,
                    targetId = member.user.id,
                    additionalDetails = "Removed member with ID ${member.user.id} from organisation $organisationId"
                )
            }
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
        authTokenService.getUserId().let { userId ->
            // Ensure that if the new role is that of OWNER, that only the current owner can assign it
            if (role == OrganisationRoles.OWNER || member.membershipDetails.role == OrganisationRoles.OWNER) {
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
                    activityService.logActivity(
                        activity = okare.core.enums.activity.Activity.ORGANISATION_MEMBER,
                        operation = okare.core.enums.util.OperationType.UPDATE,
                        userId = userId,
                        organisationId = organisationId,
                        targetId = member.user.id,
                        additionalDetails = "Updated member with ID ${member.user.id} to role $role in organisation $organisationId"
                    )
                    return this.toModel()
                }
            }
        }
    }
}