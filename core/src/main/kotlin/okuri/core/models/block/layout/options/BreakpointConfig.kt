package okuri.core.models.block.layout.options

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import com.fasterxml.jackson.annotation.JsonInclude

/**
 * Responsive breakpoint configuration
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
data class BreakpointConfig(
    val w: Int,  // screen width threshold
    val c: Int   // number of columns at this breakpoint
)