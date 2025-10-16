package okuri.core.models.common

import okuri.core.enums.common.IssueLevel

data class LintIssue(
    val path: String,
    val level: IssueLevel,
    val message: String,
)