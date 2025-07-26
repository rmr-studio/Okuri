package paladin.core.service.organisation

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.security.access.AccessDeniedException
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.bean.override.mockito.MockitoBean
import paladin.core.entities.organisation.OrganisationEntity
import paladin.core.entities.organisation.OrganisationInviteEntity
import paladin.core.entities.organisation.OrganisationMemberEntity
import paladin.core.entities.user.UserEntity
import paladin.core.enums.organisation.OrganisationInviteStatus
import paladin.core.enums.organisation.OrganisationRoles
import paladin.core.exceptions.ConflictException
import paladin.core.repository.organisation.OrganisationInviteRepository
import paladin.core.repository.organisation.OrganisationMemberRepository
import paladin.core.repository.organisation.OrganisationRepository
import util.OrganisationRole
import util.WithUserPersona
import util.factory.MockOrganisationEntityFactory
import util.factory.MockUserEntityFactory
import java.util.*

@SpringBootTest
@ExtendWith(MockitoExtension::class)
@ActiveProfiles("test")
class OrganisationInviteServiceTest {

    private val userId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

    // Two Organisation Ids that belong to the user
    private val organisationId1: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
    private val organisationId2: UUID = UUID.fromString("e9b1c2d3-4e5f-6789-abcd-ef9876543210")

    @Autowired
    private lateinit var organisationInviteService: OrganisationInviteService

    @MockitoBean
    private lateinit var organisationRepository: OrganisationRepository

    @MockitoBean
    private lateinit var organisationMemberRepository: OrganisationMemberRepository

    @MockitoBean
    private lateinit var organisationInviteRepository: OrganisationInviteRepository

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = OrganisationRoles.OWNER
            ),
            OrganisationRole(
                organisationId = "e9b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = OrganisationRoles.DEVELOPER
            )
        ]
    )
    fun `handle organisation invitation creation`() {

        val targetEmail: String = "email2@email.com"

        val user: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = userId,
            email = "email@email.com"
        )

        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = userId
        )


        val member: OrganisationMemberEntity = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user,
            role = OrganisationRoles.ADMIN
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }
            it
        }

        // Organisation that the user is an owner of, so has permissions to invite users to
        val organisation1: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation 1",
            members = mutableSetOf(member)
        )

        // Organisation that the user is a developer of, so should not have any permissions to invite users to
        val organisation2: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId2,
            name = "Test Organisation 2"
        )

        val inviteEntity: OrganisationInviteEntity = MockOrganisationEntityFactory.createOrganisationInvite(
            email = targetEmail,
            organisationId = organisationId1,
            role = OrganisationRoles.DEVELOPER,
            invitedBy = userId,
        )

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(organisation1))
        Mockito.`when`(organisationRepository.findById(organisationId2)).thenReturn(Optional.of(organisation2))
        Mockito.`when`(organisationMemberRepository.findByIdOrganisationId(organisationId1))
            .thenReturn(organisation1.members.toList())
        Mockito.`when`(organisationInviteRepository.save(Mockito.any<OrganisationInviteEntity>()))
            .thenReturn(inviteEntity)

        assertThrows<AccessDeniedException> {
            organisationInviteService.createOrganisationInvitation(
                organisationId2,
                targetEmail,
                OrganisationRoles.DEVELOPER
            )
        }

        organisationInviteService.createOrganisationInvitation(
            organisationId1,
            // Using a different email to test the invitation creation
            targetEmail,
            OrganisationRoles.DEVELOPER
        )

    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = OrganisationRoles.OWNER
            )
        ]
    )
    fun `handle rejection of invitation creation if user is already a member`() {
        // Test setup for a user trying to create an invitation for an email that is already a member of the organisation
        val targetEmail: String = "email@email.com"

        val user: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = userId,
            email = "email@email.com"
        )

        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = userId
        )

        val member: OrganisationMemberEntity = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user,
            role = OrganisationRoles.ADMIN
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }
            it
        }

        // Organisation that the user is an owner of, so has permissions to invite users to
        val organisation1: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation 1",
            members = mutableSetOf(member)
        )

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(organisation1))

        Mockito.`when`(organisationMemberRepository.findByIdOrganisationId(organisationId1))
            .thenReturn(organisation1.members.toList())

        assertThrows<ConflictException> {
            organisationInviteService.createOrganisationInvitation(
                organisationId1,
                targetEmail,
                OrganisationRoles.DEVELOPER
            )
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = OrganisationRoles.OWNER
            )
        ]
    )
    fun `handle rejection if invitation role is of type owner`() {
        assertThrows<IllegalArgumentException> {
            organisationInviteService.createOrganisationInvitation(
                organisationId1,
                "email@email.com2",
                OrganisationRoles.OWNER
            )
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = []
    )
    fun `handle invitation acceptance`() {
        val userEmail = "email@email.com"
        val token: String = OrganisationInviteEntity.generateSecureToken()

        // Organisation that the user is an owner of, so has permissions to invite users to
        val organisation1: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation 1",
        )

        val user: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = userId,
            email = userEmail
        )

        val inviteEntity: OrganisationInviteEntity = MockOrganisationEntityFactory.createOrganisationInvite(
            email = userEmail,
            organisationId = organisationId1,
            role = OrganisationRoles.DEVELOPER,
            token = token,
        )

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(organisation1))
        Mockito.`when`(organisationInviteRepository.findByToken(token)).thenReturn(Optional.of(inviteEntity))
        Mockito.`when`(organisationInviteRepository.save(Mockito.any<OrganisationInviteEntity>()))
            .thenReturn(inviteEntity.let {
                it.copy().apply {
                    inviteStatus = OrganisationInviteStatus.ACCEPTED
                }
            })
        Mockito.`when`(organisationMemberRepository.save(Mockito.any<OrganisationMemberEntity>()))
            .thenReturn(
                OrganisationMemberEntity(
                    OrganisationMemberEntity.OrganisationMemberKey(
                        organisationId = organisationId1,
                        userId = userId
                    ),
                    OrganisationRoles.DEVELOPER
                ).apply {
                    this.user = user
                }
            )

        organisationInviteService.handleInvitationResponse(token, accepted = true)
        Mockito.verify(organisationInviteRepository).save(Mockito.any<OrganisationInviteEntity>())
        Mockito.verify(organisationMemberRepository).save(Mockito.any<OrganisationMemberEntity>())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = []
    )
    fun `handle invitation rejection`() {
        val userEmail = "email@email.com"
        val token: String = OrganisationInviteEntity.generateSecureToken()

        // Organisation that the user is an owner of, so has permissions to invite users to
        val organisation1: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation 1",
        )

        val user: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = userId,
            email = userEmail
        )

        val inviteEntity: OrganisationInviteEntity = MockOrganisationEntityFactory.createOrganisationInvite(
            email = userEmail,
            organisationId = organisationId1,
            role = OrganisationRoles.DEVELOPER,
            token = token,
        )

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(organisation1))
        Mockito.`when`(organisationInviteRepository.findByToken(token)).thenReturn(Optional.of(inviteEntity))
        Mockito.`when`(organisationInviteRepository.save(Mockito.any<OrganisationInviteEntity>()))
            .thenReturn(inviteEntity.let {
                it.copy().apply {
                    inviteStatus = OrganisationInviteStatus.DECLINED
                }
            })
        Mockito.`when`(organisationMemberRepository.save(Mockito.any<OrganisationMemberEntity>()))
            .thenReturn(
                OrganisationMemberEntity(
                    OrganisationMemberEntity.OrganisationMemberKey(
                        organisationId = organisationId1,
                        userId = userId
                    ),
                    OrganisationRoles.DEVELOPER
                ).apply {
                    this.user = user
                }
            )

        organisationInviteService.handleInvitationResponse(token, accepted = false)
        Mockito.verify(organisationInviteRepository).save(Mockito.any<OrganisationInviteEntity>())
        Mockito.verify(organisationMemberRepository, Mockito.never()).save(Mockito.any<OrganisationMemberEntity>())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = []
    )
    fun `handle rejection if trying to accept an invitation that is not meant for the user`() {
        // Ensure email does not match current email in JWT
        val userEmail = "email2@email.com"
        val token: String = OrganisationInviteEntity.generateSecureToken()

        val inviteEntity: OrganisationInviteEntity = MockOrganisationEntityFactory.createOrganisationInvite(
            email = userEmail,
            organisationId = organisationId1,
            role = OrganisationRoles.DEVELOPER,
            token = token,
        )

        Mockito.`when`(organisationInviteRepository.findByToken(token)).thenReturn(Optional.of(inviteEntity))

        assertThrows<AccessDeniedException> {
            organisationInviteService.handleInvitationResponse(token, accepted = true)
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = []
    )
    fun `handle rejection if trying to accept an invitation that is not pending`() {
        // Ensure email does not match current email in JWT
        val userEmail = "email@email.com"
        val token: String = OrganisationInviteEntity.generateSecureToken()

        val inviteEntity: OrganisationInviteEntity = MockOrganisationEntityFactory.createOrganisationInvite(
            email = userEmail,
            organisationId = organisationId1,
            role = OrganisationRoles.DEVELOPER,
            token = token,
            status = OrganisationInviteStatus.EXPIRED
        )

        Mockito.`when`(organisationInviteRepository.findByToken(token)).thenReturn(Optional.of(inviteEntity))

        assertThrows<IllegalArgumentException> {
            organisationInviteService.handleInvitationResponse(token, accepted = true)
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = OrganisationRoles.OWNER
            )
        ]
    )
    fun `handle rejection if trying to revoke an invitation that is not pending`() {
        val userEmail = "email@email.com"

        val inviteEntity: OrganisationInviteEntity = MockOrganisationEntityFactory.createOrganisationInvite(
            email = userEmail,
            organisationId = organisationId1,
            role = OrganisationRoles.DEVELOPER,
            status = OrganisationInviteStatus.ACCEPTED
        )

        inviteEntity.id.let {
            if (it == null) throw IllegalArgumentException("Invite ID cannot be null")

            Mockito.`when`(organisationInviteRepository.findById(it)).thenReturn(Optional.of(inviteEntity))

            assertThrows<IllegalArgumentException> {
                organisationInviteService.revokeOrganisationInvite(organisationId1, it)
            }
        }
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = OrganisationRoles.DEVELOPER
            )
        ]
    )
    fun `handle rejection if trying to revoke an invitation with invalid permissions`() {
        val userEmail = "email@email.com"

        val inviteEntity: OrganisationInviteEntity = MockOrganisationEntityFactory.createOrganisationInvite(
            email = userEmail,
            organisationId = organisationId1,
            role = OrganisationRoles.DEVELOPER,
            status = OrganisationInviteStatus.PENDING
        )

        inviteEntity.id.let {
            if (it == null) throw IllegalArgumentException("Invite ID cannot be null")

            Mockito.`when`(organisationInviteRepository.findById(it)).thenReturn(Optional.of(inviteEntity))

            assertThrows<AccessDeniedException> {
                organisationInviteService.revokeOrganisationInvite(organisationId1, it)
            }
        }

    }
}