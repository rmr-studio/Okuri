package okuri.core.models.block.layout

import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.DeserializationContext
import com.fasterxml.jackson.databind.JsonDeserializer
import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper

/**
 * Custom deserializer for Widget that handles the stringified content field from Gridstack.
 * Gridstack stores the content as a JSON string, so we need to parse it twice.
 */
class WidgetDeserializer : JsonDeserializer<Widget>() {
    private val mapper: ObjectMapper = jacksonObjectMapper()

    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): Widget {
        val node: JsonNode = p.codec.readTree(p)

        // Parse standard fields
        val id = node.get("id").asText()
        val x = node.get("x").asInt()
        val y = node.get("y").asInt()
        val w = node.get("w").asInt()
        val h = node.get("h").asInt()

        // Parse optional constraint fields
        val minW = node.get("minW")?.asInt()
        val minH = node.get("minH")?.asInt()
        val maxW = node.get("maxW")?.asInt()
        val maxH = node.get("maxH")?.asInt()

        // Parse optional behavior fields
        val autoPosition = node.get("autoPosition")?.asBoolean()
        val locked = node.get("locked")?.asBoolean()
        val noResize = node.get("noResize")?.asBoolean()
        val noMove = node.get("noMove")?.asBoolean()

        // Parse content - handle both string and object formats
        val content: RenderContent? = node.get("content")?.let { contentNode ->
            if (contentNode.isTextual) {
                // Content is a JSON string, parse it
                val contentJson = contentNode.asText()
                if (contentJson.isNotBlank()) {
                    mapper.readValue(contentJson, RenderContent::class.java)
                } else {
                    null
                }
            } else {
                // Content is already an object, deserialize directly
                mapper.treeToValue(contentNode, RenderContent::class.java)
            }
        }

        // Parse nested subGridOpts
        val subGridOpts: TreeLayout? = node.get("subGridOpts")?.let { subGridNode ->
            mapper.treeToValue(subGridNode, TreeLayout::class.java)
        }

        return Widget(
            id = id,
            x = x,
            y = y,
            w = w,
            h = h,
            minW = minW,
            minH = minH,
            maxW = maxW,
            maxH = maxH,
            autoPosition = autoPosition,
            locked = locked,
            noResize = noResize,
            noMove = noMove,
            content = content,
            subGridOpts = subGridOpts
        )
    }
}
