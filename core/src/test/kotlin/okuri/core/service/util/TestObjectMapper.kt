package okuri.core.service.util

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule
import com.fasterxml.jackson.module.kotlin.registerKotlinModule
import java.text.DateFormat
import java.text.SimpleDateFormat

object TestObjectMapper {


    /**
     * Creates a preconfigured Jackson ObjectMapper with Kotlin and Java Time support.
     *
     * The mapper uses UTC and the pattern "yyyy-MM-dd'T'HH:mm:ss.SSSZ" for date formatting,
     * ignores unknown properties during deserialization, and writes dates as ISO-8601 strings
     * instead of timestamps.
     *
     * @return A configured `ObjectMapper`.
     */
    fun init(): ObjectMapper {
        val dateFormat: DateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
        dateFormat.timeZone = java.util.TimeZone.getTimeZone("UTC")

        return ObjectMapper().registerKotlinModule().findAndRegisterModules()
            .setDateFormat(dateFormat)
            .registerModules(JavaTimeModule())
            .configure(com.fasterxml.jackson.databind.DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
            .configure(com.fasterxml.jackson.databind.SerializationFeature.WRITE_DATES_AS_TIMESTAMPS, false)
    }

    val objectMapper: ObjectMapper = init()
}