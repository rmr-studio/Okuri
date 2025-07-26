package paladin.core.controller.organisation

import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import paladin.core.enums.organisation.OrganisationRoles
import paladin.core.models.organisation.OrganisationInvite
import paladin.core.service.organisation.OrganisationInviteService
import java.util.*

@RestController
@RequestMapping("/api/v1/organisation/invite")
@Tag(name = "Organisation Invite Management", description = "Endpoints for managing organisation invitations")
class InviteController(
    private val organisationInviteService: OrganisationInviteService
) {

    @PostMapping("/organisation/{organisationId}/email/{email}/role/{role}")
    fun inviteToOrganisation(
        @PathVariable organisationId: UUID,
        @PathVariable email: String,
        @PathVariable role: OrganisationRoles
    ): ResponseEntity<OrganisationInvite> {
        val invitation: OrganisationInvite = organisationInviteService.createOrganisationInvitation(
            organisationId = organisationId,
            email = email,
            role = role
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(invitation)
    }

    @PostMapping("/accept/{inviteToken}")
    fun acceptInvite(
        @PathVariable inviteToken: String
    ): ResponseEntity<Unit> {
        organisationInviteService.handleInvitationResponse(inviteToken, accepted = true)
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @PostMapping("/reject/{inviteToken}")
    fun rejectInvite(
        @PathVariable inviteToken: String
    ): ResponseEntity<Unit> {
        organisationInviteService.handleInvitationResponse(inviteToken, accepted = false)
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

    @GetMapping("/organisation/{organisationId}")
    fun getOrganisationInvites(
        @PathVariable organisationId: UUID
    ): ResponseEntity<List<OrganisationInvite>> {
        val invites: List<OrganisationInvite> = organisationInviteService.getOrganisationInvites(organisationId)
        return ResponseEntity.ok(invites)
    }

    @GetMapping("/user")
    fun getUserInvites(
    ): ResponseEntity<List<OrganisationInvite>> {
        val invites: List<OrganisationInvite> = organisationInviteService.getUserInvites()
        return ResponseEntity.ok(invites)
    }

    @DeleteMapping("/organisation/{organisationId}/invitation/{id}")
    fun revokeInvite(
        @PathVariable organisationId: UUID,
        @PathVariable id: UUID
    ): ResponseEntity<Unit> {
        organisationInviteService.revokeOrganisationInvite(organisationId, id)
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build()
    }

}