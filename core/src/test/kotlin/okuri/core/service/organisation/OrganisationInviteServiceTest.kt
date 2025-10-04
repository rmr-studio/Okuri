package okuri.core.service.organisation

import io.github.oshai.kotlinlogging.KLogger
import okuri.core.configuration.auth.OrganisationSecurity
import okuri.core.entity.organisation.OrganisationEntity
import okuri.core.entity.organisation.OrganisationInviteEntity
import okuri.core.entity.organisation.OrganisationMemberEntity
import okuri.core.entity.user.UserEntity
import okuri.core.enums.organisation.OrganisationInviteStatus
import okuri.core.enums.organisation.OrganisationRoles
import okuri.core.exceptions.ConflictException
import okuri.core.repository.organisation.OrganisationInviteRepository
import okuri.core.repository.organisation.OrganisationMemberRepository
import okuri.core.service.activity.ActivityService
import okuri.core.service.auth.AuthTokenService
import okuri.core.service.util.OrganisationRole
import okuri.core.service.util.WithUserPersona
import okuri.core.service.util.factory.MockOrganisationEntityFactory
import okuri.core.service.util.factory.MockUserEntityFactory
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.Mockito
import org.mockito.junit.jupiter.MockitoExtension
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Import
import org.springframework.security.access.AccessDeniedException
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
import org.springframework.test.context.bean.override.mockito.MockitoBean
import java.util.*

@SpringBootTest(
    classes = [
        OrganisationSecurity::class,
        AuthTokenService::class,
        OrganisationInviteServiceTest.TestConfig::class,
        OrganisationInviteService::class,
    ]
)
class OrganisationInviteServiceTest {

    @Configuration
    @EnableMethodSecurity(prePostEnabled = true)
    @Import(OrganisationSecurity::class)
    class TestConfig

    private val userId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

    // Two Organisation Ids that belong to the user
    private val organisationId1: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
    private val organisationId2: UUID = UUID.fromString("e9b1c2d3-4e5f-6789-abcd-ef9876543210")

    @Autowired
    private lateinit var organisationInviteService: OrganisationInviteService

    @MockitoBean
    private lateinit var organisationMemberRepository: OrganisationMemberRepository

    @MockitoBean
    private lateinit var organisationInviteRepository: OrganisationInviteRepository

    @MockitoBean
    private lateinit var organisationService: OrganisationService

    @MockitoBean
    private lateinit var activityService: ActivityService

    @MockitoBean
    private lateinit var logger: KLogger

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
                role = OrganisationRoles.MEMBER
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
            role = OrganisationRoles.MEMBER,
            invitedBy = userId,
        )

        Mockito.`when`(organisationMemberRepository.findByIdOrganisationId(organisationId1))
            .thenReturn(organisation1.members.toList())
        Mockito.`when`(organisationInviteRepository.save(Mockito.any<OrganisationInviteEntity>()))
            .thenReturn(inviteEntity)

        assertThrows<AccessDeniedException> {
            organisationInviteService.createOrganisationInvitation(
                organisationId2,
                targetEmail,
                OrganisationRoles.MEMBER
            )
        }

        organisationInviteService.createOrganisationInvitation(
            organisationId1,
            // Using a different email to test the invitation creation
            targetEmail,
            OrganisationRoles.MEMBER
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

        Mockito.`when`(organisationMemberRepository.findByIdOrganisationId(organisationId1))
            .thenReturn(organisation1.members.toList())

        assertThrows<ConflictException> {
            organisationInviteService.createOrganisationInvitation(
                organisationId1,
                targetEmail,
                OrganisationRoles.MEMBER
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
            role = OrganisationRoles.MEMBER,
            token = token,
        )

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
                    OrganisationRoles.MEMBER
                ).apply {
                    this.user = user
                }
            )

        organisationInviteService.handleInvitationResponse(token, accepted = true)
        Mockito.verify(organisationInviteRepository).save(Mockito.any<OrganisationInviteEntity>())
        Mockito.verify(organisationService).addMemberToOrganisation(
            organisationId = organisationId1,
            userId = userId,
            role = OrganisationRoles.MEMBER
        )
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
            role = OrganisationRoles.MEMBER,
            token = token,
        )

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
                    OrganisationRoles.MEMBER
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
            role = OrganisationRoles.MEMBER,
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
            role = OrganisationRoles.MEMBER,
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
            role = OrganisationRoles.MEMBER,
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
                role = OrganisationRoles.MEMBER
            )
        ]
    )
    fun `handle rejection if trying to revoke an invitation with invalid permissions`() {
        val userEmail = "email@email.com"

        val inviteEntity: OrganisationInviteEntity = MockOrganisationEntityFactory.createOrganisationInvite(
            email = userEmail,
            organisationId = organisationId1,
            role = OrganisationRoles.MEMBER,
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