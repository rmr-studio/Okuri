package okuri.core.service.schema

import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion
import okuri.core.enums.core.DataType
import okuri.core.models.block.structure.BlockSchema
import okuri.core.models.block.structure.toJsonSchema
import okuri.core.util.FormatValidator
import org.springframework.stereotype.Service

@Service
class SchemaService(private val mapper: ObjectMapper) {
    private val schemaFactory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V201909)

    fun validate(schema: BlockSchema, payload: Map<String, Any?>): List<String> {

        val schemaMap = schema.toJsonSchema()
        val schemaNode = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(schemaMap)
        val payloadNode = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(payload)

        val jsonSchema = schemaFactory.getSchema(schemaNode)
        val errors = mutableListOf<String>()

        // Run structural validation
        jsonSchema.validate(payloadNode).forEach { errors.add(it.message) }

        // Run internal format validation
        validateFormats(schema, payload, path = "").forEach { errors.add(it) }

        return errors
    }

    fun validate(schema: BlockSchema, payload: List<Map<String, Any?>>): List<String> {
        val schemaMap = schema.toJsonSchema()
        val schemaNode = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(schemaMap)
        val payloadNode = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(payload)

        val jsonSchema = schemaFactory.getSchema(schemaNode)
        val errors = mutableListOf<String>()

        // Run structural validation
        jsonSchema.validate(payloadNode).forEach { errors.add(it.message) }
        // Run internal format validation
        payload.forEachIndexed { idx, item ->
            validateFormats(schema, item, path = "[$idx]").forEach { errors.add(it) }
        }
        return errors
    }

    private fun validateFormats(schema: BlockSchema, payload: Any?, path: String): List<String> {
        val errors = mutableListOf<String>()

        if (payload == null) return errors
        
        if (payload is Map<*, *>) {
            schema.properties?.forEach { (key, childSchema) ->
                val value = payload[key]
                errors += validateFormats(childSchema, value, "$path/$key")
            }
        }

        if (payload is List<*>) {
            payload.forEachIndexed { idx, item ->
                schema.items?.let {
                    errors += validateFormats(it, item, "$path[$idx]")
                }
            }
        }

        schema.format?.let { format ->
            FormatValidator.validate(format, payload).let { response ->
                if (!response) {
                    errors.add("Invalid format for $path: expected ${format.jsonValue}, got $payload")
                }
            }
        }
        return errors
    }
}