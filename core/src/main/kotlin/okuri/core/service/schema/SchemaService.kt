package okuri.core.service.schema

import com.fasterxml.jackson.databind.ObjectMapper
import com.networknt.schema.JsonSchemaFactory
import com.networknt.schema.SpecVersion
import com.networknt.schema.ValidationMessage
import org.springframework.stereotype.Service

@Service
class SchemaService(private val mapper: ObjectMapper) {
    private val schemaFactory = JsonSchemaFactory.getInstance(SpecVersion.VersionFlag.V201909)

    fun validate(schema: Map<String, Any?>, payload: Map<String, Any?>): List<String> {
        val schemaNode = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(schema)
        val payloadNode = mapper.valueToTree<com.fasterxml.jackson.databind.JsonNode>(payload)

        val jsonSchema = schemaFactory.getSchema(schemaNode)
        val errors: Set<ValidationMessage> = jsonSchema.validate(payloadNode)

        return errors.map { it.message }
    }
}