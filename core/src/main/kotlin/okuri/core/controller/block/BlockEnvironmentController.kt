package okuri.core.controller.block

import io.swagger.v3.oas.annotations.tags.Tag
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/v1/block/environment")
@Tag(
    name = "Block Environment Management",
    description = "Endpoints for managing block environments, layouts and all block related operations"
)
class BlockEnvironmentController(
    
)