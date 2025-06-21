package okare.core.service.auth

import io.github.jan.supabase.SupabaseClient
import org.springframework.stereotype.Service

@Service
class AuthService(private val client: SupabaseClient)