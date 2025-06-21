package okare.core.service.storage

import io.github.jan.supabase.SupabaseClient
import org.springframework.stereotype.Service

@Service
class StorageService(
    private val client: SupabaseClient
)