package okuri.core.service.schema

import com.fasterxml.jackson.databind.ObjectMapper
import okuri.core.enums.block.BlockValidationScope
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

    private fun validateAllScopes(schema: BlockSchema, payload: Any?): Map<BlockValidationScope, List<String>> {
        return BlockValidationScope.entries.associateWith { scope ->
            schemaService.validate(schema, payload, scope)
        }
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

        val results = validateAllScopes(schema, payload)

        assertTrue(results[BlockValidationScope.NONE]!!.isEmpty(), "NONE should ignore validation")
        assertTrue(results[BlockValidationScope.STRICT]!!.isEmpty(), "STRICT should pass")
        assertTrue(results[BlockValidationScope.SOFT]!!.isEmpty(), "SOFT should pass")
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

        val results = validateAllScopes(schema, payload)

        assertTrue(results[BlockValidationScope.NONE]!!.isEmpty())
        assertTrue(results[BlockValidationScope.STRICT]!!.any { it.contains("email") })
        assertTrue(results[BlockValidationScope.SOFT]!!.any { it.contains("email") })
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

        val results = validateAllScopes(schema, payload)

        assertTrue(results[BlockValidationScope.NONE]!!.isEmpty())
        assertTrue(results[BlockValidationScope.STRICT]!!.any { it.contains("email") })
        assertTrue(results[BlockValidationScope.SOFT]!!.any { it.contains("email") })
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

        val results = validateAllScopes(schema, payload)

        assertTrue(results[BlockValidationScope.NONE]!!.isEmpty())
        assertTrue(results[BlockValidationScope.STRICT]!!.isEmpty())
        assertTrue(results[BlockValidationScope.SOFT]!!.isEmpty())
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

        val results = validateAllScopes(schema, payload)

        assertTrue(results[BlockValidationScope.NONE]!!.isEmpty())
        assertTrue(results[BlockValidationScope.STRICT]!!.any { it.contains("currency") })
        assertTrue(results[BlockValidationScope.SOFT]!!.any { it.contains("currency") })
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

        val results1 = validateAllScopes(schema, valid1)
        val results2 = validateAllScopes(schema, invalid)
        val results3 = validateAllScopes(schema, invalid2)

        // valid case
        assertTrue(results1[BlockValidationScope.STRICT]!!.isEmpty())
        assertTrue(results1[BlockValidationScope.SOFT]!!.isEmpty())

        // invalid percentage format
        assertTrue(results2[BlockValidationScope.STRICT]!!.any { it.contains("percent") })
        assertTrue(results2[BlockValidationScope.SOFT]!!.any { it.contains("percent") })

        // wrong type (number instead of string)
        assertTrue(results3[BlockValidationScope.STRICT]!!.any { it.contains("percent") })
        assertTrue(results3[BlockValidationScope.SOFT]!!.any { it.contains("percent") })
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
        val invalidPayload = mapOf("phone" to "not-a-phone") // not an array

        val resultsValid = validateAllScopes(schema, validPayload)
        val resultsInvalid = validateAllScopes(schema, invalidPayload)

        // Valid case
        assertTrue(resultsValid[BlockValidationScope.STRICT]!!.isEmpty())
        assertTrue(resultsValid[BlockValidationScope.SOFT]!!.isEmpty())

        // Invalid case
        assertTrue(resultsInvalid[BlockValidationScope.STRICT]!!.any { it.contains("array") })
        assertTrue(resultsInvalid[BlockValidationScope.SOFT]!!.any { it.contains("array") })

        // SOFT mode should also show deep issues (like missing name or invalid phone)
        assertTrue(
            resultsInvalid[BlockValidationScope.SOFT]!!.any { it.contains("phone") },
            "SOFT mode should report phone format issue"
        )
    }
}
