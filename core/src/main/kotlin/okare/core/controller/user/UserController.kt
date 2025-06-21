package okare.core.controller.user

import io.swagger.v3.oas.annotations.tags.Tag
import okare.core.models.user.User
import okare.core.service.user.UserService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.util.*

@RestController
@RequestMapping("/api/v1/user")
@Tag(name = "User Management", description = "Endpoints for managing user profiles and details")
class UserController(
    private val profileService: UserService
) {

    @PutMapping("/")
    fun updateUserProfile(@RequestBody user: User): ResponseEntity<User> {
        val updatedUserProfile = profileService.updateUserDetails(user)
        return ResponseEntity.ok(updatedUserProfile)
    }

    @GetMapping("/")
    fun getCurrentUser(): ResponseEntity<User> {
        val user: User = profileService.getUserFromSession()
        return ResponseEntity.ok(user)
    }

    @GetMapping("/id/{userId}")
    fun getUserById(@PathVariable userId: UUID): ResponseEntity<User> {
        val userProfile = profileService.getUserById(userId)
        return ResponseEntity.ok(userProfile)
    }

    @DeleteMapping("/id/{userId}")
    fun deleteUserProfileById(@PathVariable userId: UUID): ResponseEntity<Void> {
        profileService.deleteUserProfile(userId)
        return ResponseEntity.noContent().build()
    }
}