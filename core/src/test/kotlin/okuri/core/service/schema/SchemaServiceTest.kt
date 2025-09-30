package okuri.core.service.schema

import com.fasterxml.jackson.databind.ObjectMapper
import okuri.core.enums.core.DataFormat
import okuri.core.enums.core.DataType
import okuri.core.models.block.structure.BlockSchema
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class SchemaServiceTest {

    private lateinit var schemaService: SchemaService

    @BeforeEach
    fun setup() {
        schemaService = SchemaService(ObjectMapper())
    }

    @Test
    fun `valid object passes structural validation`() {
        val schema = BlockSchema(
            name = "Contact",
            type = DataType.OBJECT,
            properties = mapOf(
                "name" to BlockSchema("Name", type = DataType.STRING, required = true),
                "email" to BlockSchema("Email", type = DataType.STRING, format = DataFormat.EMAIL, required = true)
            )
        )

        val payload = mapOf("name" to "Alice", "email" to "alice@example.com")

        val errors = schemaService.validate(schema, payload)
        assertTrue(errors.isEmpty(), "Expected no validation errors but got $errors")
    }

    @Test
    fun `missing required field fails validation`() {
        val schema = BlockSchema(
            name = "Contact",
            type = DataType.OBJECT,
            properties = mapOf(
                "name" to BlockSchema("Name", type = DataType.STRING, required = true),
                "email" to BlockSchema("Email", type = DataType.STRING, format = DataFormat.EMAIL, required = true)
            )
        )

        val payload = mapOf("name" to "Alice") // missing email

        val errors = schemaService.validate(schema, payload)
        assertTrue(errors.any { it.contains("email") }, "Expected error for missing email field")
    }

    @Test
    fun `invalid email fails format validation`() {
        val schema = BlockSchema(
            name = "Contact",
            type = DataType.OBJECT,
            properties = mapOf(
                "email" to BlockSchema("Email", type = DataType.STRING, format = DataFormat.EMAIL, required = true)
            )
        )

        val payload = mapOf("email" to "not-an-email")

        val errors = schemaService.validate(schema, payload)
        assertTrue(errors.any { it.contains("email") }, "Expected email format validation error")
    }

    @Test
    fun `valid currency passes custom format validation`() {
        val schema = BlockSchema(
            name = "Price",
            type = DataType.OBJECT,
            properties = mapOf(
                "currency" to BlockSchema(
                    "Currency",
                    type = DataType.STRING,
                    format = DataFormat.CURRENCY,
                    required = true
                )
            )
        )

        val payload = mapOf("currency" to "USD")

        val errors = schemaService.validate(schema, payload)
        assertTrue(errors.isEmpty(), "Expected no errors for valid currency code")
    }

    @Test
    fun `invalid currency fails custom format validation`() {
        val schema = BlockSchema(
            name = "Price",
            type = DataType.OBJECT,
            properties = mapOf(
                "currency" to BlockSchema(
                    "Currency",
                    type = DataType.STRING,
                    format = DataFormat.CURRENCY,
                    required = true
                )
            )
        )

        val payload = mapOf("currency" to "US") // not a 3-letter ISO code

        val errors = schemaService.validate(schema, payload)
        assertTrue(errors.any { it.contains("currency") }, "Expected error for invalid currency format")
    }

    @Test
    fun `percentage accepts strings`() {
        val schema = BlockSchema(
            name = "Discount",
            type = DataType.OBJECT,
            properties = mapOf(
                "percent" to BlockSchema(
                    "Percent",
                    type = DataType.STRING,
                    format = DataFormat.PERCENTAGE,
                    required = true
                )
            )
        )

        val valid1 = mapOf("percent" to "50%")
        val invalid = mapOf("percent" to "200%")
        val invalid2 = mapOf("percent" to 25)

        assertTrue(schemaService.validate(schema, valid1).isEmpty())
        assertTrue(schemaService.validate(schema, invalid).any { it.contains("percent") })
        assertTrue(schemaService.validate(schema, invalid2).any { it.contains("percent") })
    }

    @Test
    fun `array of objects validates recursively`() {
        val contactSchema = BlockSchema(
            name = "Contact",
            type = DataType.OBJECT,
            properties = mapOf(
                "name" to BlockSchema("Name", type = DataType.STRING, required = true),
                "phone" to BlockSchema("Phone", type = DataType.STRING, format = DataFormat.PHONE)
            )
        )

        val schema = BlockSchema(
            name = "Contacts",
            type = DataType.ARRAY,
            items = contactSchema
        )

        val validPayload = listOf(
            mapOf("name" to "Alice", "phone" to "+123456789"),
            mapOf("name" to "Bob", "phone" to "+198765432")
        )

        val invalidPayload = mapOf("phone" to "not-a-phone") // missing name, invalid phone

        assertTrue(schemaService.validate(schema, validPayload).isEmpty())
        val errors = schemaService.validate(schema, invalidPayload)
        assertTrue(errors.any { it.contains("array") })
    }
}
