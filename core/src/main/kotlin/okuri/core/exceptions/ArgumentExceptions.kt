package okuri.core.exceptions

class NotFoundException(message: String) : RuntimeException(message)
class ConflictException(message: String) : RuntimeException(message)
class SupabaseException(message: String) : RuntimeException(message)
