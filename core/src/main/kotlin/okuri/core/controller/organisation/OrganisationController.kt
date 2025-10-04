package okuri.core.controller.organisation

import io.swagger.v3.oas.annotations.tags.Tag
import okuri.core.enums.organisation.OrganisationRoles
import okuri.core.models.organisation.Organisation
import okuri.core.models.organisation.OrganisationMember
import okuri.core.models.organisation.request.OrganisationCreationRequest
import okuri.core.service.organisation.OrganisationService
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/organisation")
@Tag(name = "Organisation Management", description = "Endpoints for managing organisations and their members")
class OrganisationController(
    private val organisationService: OrganisationService
) {


    /**
     * Retrieves an organisation by its identifier.
     *
     * @param organisationId The UUID of the organisation to retrieve.
     * @param includeMetadata If `true`, include additional organisation metadata in the response.
     * @return The requested Organisation contained in the response body (HTTP 200).
     */
    @GetMapping("/{organisationId}")
    fun getOrganisation(
        @PathVariable organisationId: UUID,
        @RequestParam includeMetadata: Boolean = false
    ): ResponseEntity<Organisation> {
        val organisation: Organisation = this.organisationService.getOrganisationById(
            organisationId = organisationId,
            includeMetadata = includeMetadata
        )

        return ResponseEntity.ok(organisation)
    }

    @PostMapping("/")
    fun createOrganisation(@RequestBody organisation: OrganisationCreationRequest): ResponseEntity<Organisation> {
        val createdOrganisation: Organisation = this.organisationService.createOrganisation(
            organisation
        )

        return ResponseEntity.status(HttpStatus.CREATED).body(createdOrganisation)
    }


    @PutMapping("/")
    fun updateOrganisation(
        @RequestBody organisation: Organisation
    ): ResponseEntity<Organisation> {
        val updatedOrganisation: Organisation = this.organisationService.updateOrganisation(
            organisation = organisation
        )

        return ResponseEntity.ok(updatedOrganisation)
    }

    @DeleteMapping("/{organisationId}")
    fun deleteOrganisation(
        @PathVariable organisationId: UUID
    ): ResponseEntity<Void> {
        this.organisationService.deleteOrganisation(organisationId)
        return ResponseEntity.ok().build()
    }

    @DeleteMapping("/{organisationId}/member")
    fun removeMemberFromOrganisation(
        @PathVariable organisationId: UUID,
        @RequestBody member: OrganisationMember
    ): ResponseEntity<Void> {
        this.organisationService.removeMemberFromOrganisation(organisationId, member)
        return ResponseEntity.ok().build()
    }

    @PutMapping("/{organisationId}/member/role/{role}")
    fun updateMemberRole(
        @PathVariable organisationId: UUID,
        @PathVariable role: OrganisationRoles,
        @RequestBody member: OrganisationMember
    ): ResponseEntity<OrganisationMember> {
        val updatedMember: OrganisationMember = this.organisationService.updateMemberRole(
            organisationId = organisationId,
            member = member,
            role = role
        )
        return ResponseEntity.ok(updatedMember)
    }
}