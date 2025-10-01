package okuri.core.service.schema

import com.fasterxml.jackson.databind.ObjectMapper
import okuri.core.enums.block.BlockValidationScope
import okuri.core.enums.core.DataFormat
import okuri.core.enums.core.DataType
import okuri.core.models.block.structure.BlockSchema
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import kotlin.test.assertFalse

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

    // ---------------------------------------------------
    // BASIC VALIDATION TESTS
    // ---------------------------------------------------

    @Test
    fun `valid object passes validation`() {
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

        assertTrue(results[BlockValidationScope.NONE]!!.isEmpty())
        assertTrue(results[BlockValidationScope.STRICT]!!.isEmpty())
        assertTrue(results[BlockValidationScope.SOFT]!!.isEmpty())
    }

    @Test
    fun `missing required field detected by JSON Schema and recursion`() {
        val schema = BlockSchema(
            name = "Contact",
            type = DataType.OBJECT,
            properties = mapOf(
                "name" to BlockSchema("Name", type = DataType.STRING, required = true),
                "email" to BlockSchema("Email", type = DataType.STRING, format = DataFormat.EMAIL, required = true)
            )
        )
        val payload = mapOf("name" to "Alice")

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

        assertTrue(results[BlockValidationScope.STRICT]!!.any { it.contains("email") })
        assertTrue(results[BlockValidationScope.SOFT]!!.any { it.contains("email") })
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
        val invalidPayload = mapOf("phone" to "not-a-phone") // wrong type

        val resultsValid = validateAllScopes(schema, validPayload)
        val resultsInvalid = validateAllScopes(schema, invalidPayload)

        assertTrue(resultsValid[BlockValidationScope.STRICT]!!.isEmpty())

        // STRICT sees only type mismatch
        assertTrue(resultsInvalid[BlockValidationScope.STRICT]!!.any { it.contains("array") })

        // SOFT sees deeper issues too
        assertTrue(resultsInvalid[BlockValidationScope.SOFT]!!.any { it.contains("phone") })
    }

    // ---------------------------------------------------
    // HYBRID JSON SCHEMA EDGE CASES
    // ---------------------------------------------------

    @Test
    fun `extra property detected by JSON Schema`() {
        val schema = BlockSchema(
            name = "User",
            type = DataType.OBJECT,
            properties = mapOf(
                "id" to BlockSchema("Id", type = DataType.NUMBER, required = true)
            )
        )
        val payload = mapOf("id" to 1, "extra" to "oops") // "extra" not defined

        val results = validateAllScopes(schema, payload)

        // JSON Schema should complain about "additional properties" in strict mode
        assertTrue(results[BlockValidationScope.STRICT]!!.any { it.contains("additional") || it.contains("extra") })
        assertFalse(results[BlockValidationScope.SOFT]!!.any { it.contains("additional") || it.contains("extra") })
    }

    @Test
    fun `wrong type detected by JSON Schema but not recursion`() {
        val schema = BlockSchema(
            name = "Product",
            type = DataType.OBJECT,
            properties = mapOf(
                "price" to BlockSchema("Price", type = DataType.NUMBER, required = true)
            )
        )
        val payload = mapOf("price" to "NaN")

        val results = validateAllScopes(schema, payload)

        // JSON Schema catches number vs string
        assertTrue(results[BlockValidationScope.STRICT]!!.any { it.contains("number") })
    }

    @Test
    fun `nested required fields caught by JSON Schema`() {
        val addressSchema = BlockSchema(
            name = "Address",
            type = DataType.OBJECT,
            properties = mapOf(
                "city" to BlockSchema("City", type = DataType.STRING, required = true),
                "postcode" to BlockSchema("Postcode", type = DataType.STRING, required = true)
            )
        )
        val schema = BlockSchema(
            name = "User",
            type = DataType.OBJECT,
            properties = mapOf(
                "address" to addressSchema
            )
        )
        val payload = mapOf("address" to mapOf("city" to "Sydney"))

        val results = validateAllScopes(schema, payload)

        // JSON Schema will complain about missing "postcode"
        assertTrue(results[BlockValidationScope.STRICT]!!.any { it.contains("postcode") })
    }

    @Test
    fun `array length constraints enforced by JSON Schema`() {
        val itemSchema = BlockSchema("Item", type = DataType.STRING)
        val schema = BlockSchema(
            name = "Tags",
            type = DataType.ARRAY,
            items = itemSchema
        )

        val payload = emptyList<String>()

        val results = validateAllScopes(schema, payload)

        // JSON Schema may complain if "minItems" or "required" applied (not in this example, but test placeholder)
        // For now we expect no errors because schema has no constraints
        assertTrue(results[BlockValidationScope.STRICT]!!.isEmpty())
    }
}
