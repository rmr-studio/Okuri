package okuri.core.service.organisation

import io.github.oshai.kotlinlogging.KLogger

import okuri.core.entity.organisation.OrganisationEntity
import okuri.core.entity.organisation.OrganisationMemberEntity
import okuri.core.entity.organisation.toModel
import okuri.core.entity.user.toModel
import okuri.core.enums.organisation.OrganisationRoles
import okuri.core.exceptions.NotFoundException
import okuri.core.models.organisation.Organisation
import okuri.core.models.organisation.OrganisationMember
import okuri.core.models.organisation.request.OrganisationCreationRequest
import okuri.core.repository.organisation.OrganisationMemberRepository
import okuri.core.repository.organisation.OrganisationRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.user.UserService
import okuri.core.util.ServiceUtil.findOrThrow
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
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
     * Retrieve an organisation by its ID, optionally including metadata.
     *
     * @param includeMetadata When true, include additional metadata such as audit information and team members.
     * @return The organisation model corresponding to the given ID.
     * @throws NotFoundException If no organisation exists with the provided ID.
     */
    @Throws(NotFoundException::class)
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getOrganisationById(organisationId: UUID, includeMetadata: Boolean = false): Organisation {
        return getEntityById(organisationId).toModel(includeMetadata)
    }

    /**
     * Retrieve the OrganisationEntity for the given organisationId.
     *
     * @param organisationId The UUID of the organisation to fetch.
     * @return The matching OrganisationEntity.
     * @throws NotFoundException If no organisation exists with the provided id.
     */
    @Throws(NotFoundException::class)
    @PreAuthorize("@organisationSecurity.hasOrg(#organisationId)")
    fun getEntityById(organisationId: UUID): OrganisationEntity {
        return findOrThrow { organisationRepository.findById(organisationId) }
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
                val organisation = this.toModel(includeMetadata = false)
                organisation.run {
                    // Log the activity of creating an organisation
                    activityService.logActivity(
                        activity = okuri.core.enums.activity.Activity.ORGANISATION,
                        operation = okuri.core.enums.util.OperationType.CREATE,
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

    /**
     * Update an organisation's persisted fields and record the update activity.
     *
     * Logs an ORGANISATION UPDATE activity attributed to the caller.
     *
     * @param organisation The organisation model containing updated fields; must include a valid `id`.
     * @return The updated organisation model reflecting the persisted changes.
     */
    @PreAuthorize("@organisationSecurity.hasOrgRoleOrHigher(#organisation.id, 'ADMIN')")
    fun updateOrganisation(organisation: Organisation): Organisation {
        authTokenService.getUserId().let { userId ->
            findOrThrow { organisationRepository.findById(organisation.id) }.run {
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
                        activity = okuri.core.enums.activity.Activity.ORGANISATION,
                        operation = okuri.core.enums.util.OperationType.UPDATE,
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
     * Deletes the organisation identified by [organisationId] along with all associated membership records.
     *
     * This operation is transactional and logs an ORGANISATION DELETE activity that includes the organisation name.
     *
     * @param organisationId The UUID of the organisation to delete.
     */
    @PreAuthorize("@organisationSecurity.hasOrgRoleOrHigher(#organisationId, 'OWNER')")
    @Transactional
    fun deleteOrganisation(organisationId: UUID) {
        authTokenService.getUserId().let { userId ->


            // Check if the organisation exists
            val organisation: OrganisationEntity = findOrThrow { organisationRepository.findById(organisationId) }

            // Delete all members associated with the organisation
            organisationMemberRepository.deleteByIdOrganisationId(organisationId)

            // Delete the organisation itself
            organisationRepository.delete(organisation).run {
                // Log the activity of deleting an organisation
                activityService.logActivity(
                    activity = okuri.core.enums.activity.Activity.ORGANISATION,
                    operation = okuri.core.enums.util.OperationType.DELETE,
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
     * Remove a member from the specified organisation when the caller is authorized to do so.
     *
     * Removes the membership record and records an organisation-member deletion activity.
     *
     * @param organisationId ID of the organisation to remove the member from.
     * @param member The member to remove.
     * @throws IllegalArgumentException if attempting to remove the organisation owner (ownership must be transferred first).
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
                findOrThrow { organisationMemberRepository.findById(this) }
                organisationMemberRepository.deleteById(this)
                activityService.logActivity(
                    activity = okuri.core.enums.activity.Activity.ORGANISATION_MEMBER,
                    operation = okuri.core.enums.util.OperationType.DELETE,
                    userId = userId,
                    organisationId = organisationId,
                    targetId = member.user.id,
                    additionalDetails = "Removed member with ID ${member.user.id} from organisation $organisationId"
                )
            }
        }

    }

    /**
     * Update a member's role within an organisation.
     *
     * This operation persists the new role for the specified member and logs the change. It does not allow assigning or removing the OWNER role; ownership transfers must use the dedicated transfer method.
     *
     * @param organisationId The organisation's ID.
     * @param member The member to update.
     * @param role The new role to assign to the member.
     * @return The updated organisation member model.
     * @throws IllegalArgumentException If the new role or the member's current role is `OWNER`.
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
                findOrThrow { organisationMemberRepository.findById(this) }.run {
                    this.apply {
                        this.role = role
                    }

                    organisationMemberRepository.save(this)
                    activityService.logActivity(
                        activity = okuri.core.enums.activity.Activity.ORGANISATION_MEMBER,
                        operation = okuri.core.enums.util.OperationType.UPDATE,
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