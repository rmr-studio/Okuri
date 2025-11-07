package okuri.core.models.block.tree

import okuri.core.entity.util.AuditableModel
import okuri.core.enums.block.layout.LayoutScope
import okuri.core.models.block.layout.TreeLayout
import java.io.Serializable
import java.time.ZonedDateTime
import java.util.*

data class BlockTreeLayout(
    val id: UUID,
    val organisationId: UUID,
    val scope: LayoutScope,
    val layout: TreeLayout,
    // Keep these hidden unless within an internal organisation context
    override val createdAt: ZonedDateTime? = null,
    override val updatedAt: ZonedDateTime? = null,
    override val createdBy: UUID? = null,
    override val updatedBy: UUID? = null,
) : Serializable, AuditableModel()