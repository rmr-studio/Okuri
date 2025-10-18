package okuri.core.service.block

import okuri.core.enums.common.IssueLevel
import okuri.core.models.block.structure.BindingSource
import okuri.core.models.block.structure.BlockDisplay
import okuri.core.models.block.structure.RefPresentation
import okuri.core.models.common.LintIssue
import org.springframework.stereotype.Service

@Service
class BlockDisplayLinterService {

    fun lint(display: BlockDisplay): List<LintIssue> {
        val (_, render) = display
        val issues = mutableListOf<LintIssue>()
        val ids = render.components.keys

        // 1) Layout IDs exist
        render.layoutGrid.items.forEachIndexed { i, it ->
            if (!ids.contains(it.id)) {
                issues += LintIssue(
                    path = "layout.items[$i].id",
                    message = "Unknown component id '${it.id}'",
                    level = IssueLevel.ERROR
                )
            }
            if (it.lg.width <= 0 || it.lg.height <= 0) {
                issues += LintIssue(
                    path = "layout.items[$i].lg",
                    message = "Invalid size w/h",
                    level = IssueLevel.ERROR
                )
            }
        }

        render.components.forEach { (cid, node) ->
            node.slots?.forEach { (slot, children) ->
                children.forEachIndexed { idx, childId ->
                    if (!ids.contains(childId)) {
                        issues += LintIssue(
                            path = "components.$cid.slots.$slot[$idx]",
                            message = "Unknown child id '$childId'",
                            level = IssueLevel.ERROR
                        )
                    }
                }
            }

            node.bindings.forEachIndexed { bi, b ->
                when (b.source) {
                    is BindingSource.DataPath -> {
                        if (!b.source.path.startsWith("$.data/")) {
                            issues += LintIssue(
                                path = "components.$cid.bindings[$bi].source.path",
                                message = "Path should start with \$.data/", level = IssueLevel.WARNING
                            )
                        }
                    }

                    is BindingSource.RefSlot -> {
                        if (b.source.presentation == RefPresentation.INLINE && b.prop.contains(".")) {
                            // INLINE usually binds to a top-level collection prop
                            issues += LintIssue(
                                path = "components.$cid.bindings[$bi]",
                                message = "INLINE refs should bind to a top-level prop (not nested)",
                                level = IssueLevel.WARNING
                            )
                        }
                    }

                    is BindingSource.Computed -> {
                        // reserved for later
                    }
                }
            }
        }
        
        return issues
    }
}