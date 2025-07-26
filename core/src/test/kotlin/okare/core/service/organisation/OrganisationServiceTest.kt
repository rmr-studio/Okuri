package okare.core.service.organisation

import okare.core.entity.organisation.OrganisationEntity
import okare.core.entity.organisation.OrganisationMemberEntity
import okare.core.entity.organisation.toModel
import okare.core.entity.user.UserEntity
import okare.core.enums.organisation.OrganisationRoles
import okare.core.models.organisation.Organisation
import okare.core.models.organisation.OrganisationMember
import okare.core.repository.organisation.OrganisationMemberRepository
import okare.core.repository.organisation.OrganisationRepository
import okare.core.util.OrganisationRole
import okare.core.util.WithUserPersona
import okare.core.util.factory.MockOrganisationEntityFactory
import okare.core.util.factory.MockUserEntityFactory
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
import java.util.*

@SpringBootTest
@ExtendWith(MockitoExtension::class)
@ActiveProfiles("test")
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
class OrganisationServiceTest {

    private val userId: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef0123456789")

    // Two Organisation Ids that belong to the user
    private val organisationId1: UUID = UUID.fromString("f8b1c2d3-4e5f-6789-abcd-ef9876543210")
    private val organisationId2: UUID = UUID.fromString("e9b1c2d3-4e5f-6789-abcd-ef9876543210")

    // Organisation Id to test access control with an org a user is not apart of
    private val organisationId3 = UUID.fromString("d8b1c2d3-4e5f-6789-abcd-ef9876543210")

    @MockitoBean
    private lateinit var organisationRepository: OrganisationRepository

    @MockitoBean
    private lateinit var organisationMemberRepository: OrganisationMemberRepository

    @Autowired
    private lateinit var organisationService: OrganisationService

    @Test
    fun `handle organisation fetch with appropriate permissions`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation",
        )

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))
        val organisation = organisationService.getOrganisation(organisationId1)
        assert(organisation.id == organisationId1)

    }

    @Test
    fun `handle organisation fetch without required organisation`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            // This is the organisation the user does not have access to
            id = organisationId3,
            name = "Test Organisation 3",
        )

        Mockito.`when`(organisationRepository.findById(organisationId3)).thenReturn(Optional.of(entity))

        assertThrows<AccessDeniedException> {
            organisationService.getOrganisation(organisationId3)
        }
    }

    @Test
    fun `handle organisation invocation without required permission`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            // This is the organisation the user is not the owner of
            id = organisationId2,
            name = "Test Organisation 2",
        )

        val updatedEntityRequest: Organisation = entity.let {
            it.copy().apply {
                name = "Updated Organisation Name"
            }
        }.toModel()

        Mockito.`when`(organisationRepository.findById(organisationId2)).thenReturn(Optional.of(entity))
        // Assert user can fetch the organisation given org roles
        organisationService.getOrganisation(organisationId2).run {
            assert(id == organisationId2) { "Organisation ID does not match expected ID" }
            assert(name == "Test Organisation 2") { "Organisation name does not match expected name" }
        }

        // Assert user cannot update organisation given lack of `Admin` privileges
        assertThrows<AccessDeniedException> {
            organisationService.updateOrganisation(updatedEntityRequest)
        }

        // Assert user cannot delete organisation given lack of `Owner` privileges
        assertThrows<AccessDeniedException> {
            organisationService.deleteOrganisation(organisationId2)
        }
    }

    @Test
    fun `handle organisation invocation with required permissions`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            // This is the organisation the user is the owner of
            id = organisationId1,
            name = "Test Organisation 1",
        )

        val updatedEntityRequest: Organisation = entity.let {
            it.copy().apply {
                name = "Updated Organisation Name"
            }
        }.toModel()

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))
        Mockito.`when`(organisationRepository.save(Mockito.any(OrganisationEntity::class.java)))
            .thenReturn(entity)

        Mockito.doNothing()
            .`when`(organisationMemberRepository)
            .deleteById(Mockito.any())
        // Assert user can fetch the organisation given org roles
        organisationService.getOrganisation(organisationId1).run {
            assert(id == organisationId1) { "Organisation ID does not match expected ID" }
            assert(name == "Test Organisation 1") { "Organisation name does not match expected name" }
        }

        // Assert user can update organisation given `Admin` privileges
        organisationService.updateOrganisation(updatedEntityRequest).run {
            assert(id == organisationId1) { "Updated Organisation ID does not match expected ID" }
            assert(name == "Updated Organisation Name") { "Updated Organisation name does not match expected name" }
        }

        // Assert user can delete organisation given `Owner` privileges
        organisationService.deleteOrganisation(organisationId1)
        // Verify the delete was called
        Mockito.verify(organisationRepository).delete(Mockito.any<OrganisationEntity>())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = OrganisationRoles.ADMIN
            )
        ]
    )
    fun `handle self removal from organisation`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation",
        )

        val user: UserEntity = MockUserEntityFactory.createUser(
            id = userId,
        )

        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = userId
        )

        val member: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user,
            role = OrganisationRoles.ADMIN
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))


        // Assert user is able to remove themselves from the organisation, given the user id in the body matches the JWT
        organisationService.removeMemberFromOrganisation(organisationId1, member).run {
            assert(true) { "Self-removal from organisation should not throw an exception" }
        }

        // Verify that the member repository was called to remove the user
        Mockito.verify(organisationMemberRepository).deleteById(Mockito.any())
    }

    @Test
    fun `handle rejecting removal of member who has ownership permissions`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation",
        )

        val user: UserEntity = MockUserEntityFactory.createUser(
            id = userId,
        )

        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = userId
        )

        val member: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user,
            role = OrganisationRoles.OWNER
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))
        assertThrows<IllegalArgumentException> {
            organisationService.removeMemberFromOrganisation(organisationId1, member)
        }.apply {
            assert(message == "Cannot remove the owner of the organisation. Please transfer ownership first.") {
                "Exception message does not match expected message"
            }
        }
    }

    @Test
    fun `handle member removal invocation with correct permissions`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation",
        )

        val targetUserId = UUID.randomUUID()

        val user: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = targetUserId,
        )

        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = targetUserId
        )

        val member: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user,
            role = OrganisationRoles.MEMBER
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))

        // Assert user is able to remove a member from the organisation, given the user has `Admin` privileges
        organisationService.removeMemberFromOrganisation(organisationId1, member).run {
            assert(true) { "Member removal from organisation should not throw an exception" }
        }

        // Verify that the member repository was called to remove the user
        Mockito.verify(organisationMemberRepository).deleteById(Mockito.any())
    }

    @Test
    @WithUserPersona(
        userId = "f8b1c2d3-4e5f-6789-abcd-ef0123456789",
        email = "email@email.com",
        displayName = "Jared Tucker",
        roles = [
            OrganisationRole(
                organisationId = "f8b1c2d3-4e5f-6789-abcd-ef9876543210",
                role = OrganisationRoles.ADMIN
            )
        ]
    )
    fun `handle member removal invocation with incorrect permissions`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation",
        )

        val targetUserId = UUID.randomUUID()

        val user: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = targetUserId,
        )

        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = targetUserId
        )

        val member: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user,
            role = OrganisationRoles.ADMIN
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))

        assertThrows<AccessDeniedException> {
            // Assert user is not able to remove a member from the organisation, given the user does not have `Admin` privileges
            organisationService.removeMemberFromOrganisation(organisationId1, member)
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
    fun `handle member role update with incorrect positions`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation",
        )

        val targetUserId = UUID.randomUUID()

        val user: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = targetUserId,
        )

        val key = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = targetUserId
        )

        val member: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user,
            role = OrganisationRoles.MEMBER
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))

        assertThrows<AccessDeniedException> {
            // Assert user is not able to remove a member from the organisation, given the user does not have `Admin` privileges
            organisationService.updateMemberRole(organisationId1, member, OrganisationRoles.OWNER)
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
                role = OrganisationRoles.ADMIN
            )
        ]
    )
    fun `handle member role update as an admin`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation",
        )

        val targetUserId = UUID.randomUUID()
        val targetUser2Id = UUID.randomUUID()
        val targetUser3Id = UUID.randomUUID()

        val user1: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = targetUserId,
        )

        val user2: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = targetUser2Id,
        )

        val user3: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = targetUser3Id,
        )

        val key1 = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = targetUserId
        )

        val key2 = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = targetUser2Id
        )

        val key3 = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = targetUser3Id
        )

        val memberDeveloper: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user1,
            role = OrganisationRoles.MEMBER
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key1)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        val memberAdmin: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user2,
            role = OrganisationRoles.ADMIN
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key2)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }


        val memberOwner: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user3,
            role = OrganisationRoles.OWNER
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key3)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))

        // Assert user is able to update a members role
        organisationService.updateMemberRole(organisationId1, memberDeveloper, OrganisationRoles.ADMIN).run {
            assert(true) { "Member removal from organisation should not throw an exception" }

            // Verify that the member repository was called to remove the user
            Mockito.verify(organisationMemberRepository).save(Mockito.any())
        }

        // Assert user is unable to update the role of another admin
        assertThrows<AccessDeniedException> {
            organisationService.updateMemberRole(organisationId1, memberAdmin, OrganisationRoles.OWNER)
        }

        // Assert user is unable to update the role of an owner
        assertThrows<AccessDeniedException> {
            organisationService.updateMemberRole(organisationId1, memberOwner, OrganisationRoles.ADMIN)
        }

        // Assert user is not able to update the role of any member to OWNER
        assertThrows<IllegalArgumentException> {
            organisationService.updateMemberRole(organisationId1, memberDeveloper, OrganisationRoles.OWNER)
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
    fun `handle member role update as an owner`() {
        val entity: OrganisationEntity = MockOrganisationEntityFactory.createOrganisation(
            id = organisationId1,
            name = "Test Organisation",
        )

        val targetUserId = UUID.randomUUID()
        val targetUser2Id = UUID.randomUUID()

        val user1: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = targetUserId,
        )

        val user2: UserEntity = MockUserEntityFactory.createUser(
            // Different user ID to test member removal
            id = targetUser2Id,
        )

        val key1 = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = targetUserId
        )

        val key2 = OrganisationMemberEntity.OrganisationMemberKey(
            organisationId = organisationId1,
            userId = targetUser2Id
        )

        val memberDeveloper: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user1,
            role = OrganisationRoles.MEMBER
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key1)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        val memberAdmin: OrganisationMember = MockOrganisationEntityFactory.createOrganisationMember(
            organisationId = organisationId1,
            user = user2,
            role = OrganisationRoles.ADMIN
        ).let {
            it.run {
                Mockito.`when`(organisationMemberRepository.findById(key2)).thenReturn(Optional.of(this))
            }

            OrganisationMember.fromEntity(it, entity)
        }

        Mockito.`when`(organisationRepository.findById(organisationId1)).thenReturn(Optional.of(entity))

        // Assert user is able to update a members role
        organisationService.updateMemberRole(organisationId1, memberDeveloper, OrganisationRoles.ADMIN).run {
            assert(true) { "Member role update should not throw an exception" }
            // Verify the save function was invoked to update the role of the user
            Mockito.verify(organisationMemberRepository).save(Mockito.any())
        }

        // Assert user is able to update an admins role
        organisationService.updateMemberRole(organisationId1, memberAdmin, OrganisationRoles.MEMBER).run {
            assert(true) { "Admin role update should not throw an exception" }
            // Verify the save function was invoked for a second time to update the role of the user
            Mockito.verify(organisationMemberRepository, Mockito.times(2)).save(Mockito.any())
        }

        // Assert user is not able to update the role of any member to OWNER
        assertThrows<IllegalArgumentException> {
            organisationService.updateMemberRole(organisationId1, memberDeveloper, OrganisationRoles.OWNER)
        }
    }
}