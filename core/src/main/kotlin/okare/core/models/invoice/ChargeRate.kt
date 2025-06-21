package okare.core.models.invoice

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import java.io.Serializable

@JsonIgnoreProperties(ignoreUnknown = true)
data class ChargeRate(
    val publicHolidayMultiplier: Double = 0.0,
    val saturdayMultiplier: Double = 0.0,
    val sundayMultiplier: Double = 0.0
) : Serializable