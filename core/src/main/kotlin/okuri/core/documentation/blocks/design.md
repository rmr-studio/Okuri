# Blocks

### Environment

The Frontend client provides a block-based design environment for all core areas of business logic.

- Clients
- Projects
- Invoices
- Organisations
- Line Items

This environment is built up of multiple fully customisable block trees. Each block tree then contains many different
sets and layouts
of blocks created by the user, or the organisation. A block can range from a primitive data type, pre-filled components,
or complex container layouts
to support the nesting of other blocks to create rich and dynamic designs.
When loading a page, all block fetched and a tree is constructed based on the block relationships and layouts.

### Block Tree Data Structure

Each block follows the same core structure:

**Block Tree** `core/models/block/BlockTree.kt`

The block tree is the root structure that contains all nodes for a given design.

```
data class BlockTree(
    val root: Node,
) : Referenceable<BlockTree>{...}

-- Every Node in a Tree is either a ContentNode or ReferenceNode
sealed interface Node {
    val block: Block
    val warnings: List<String>
}

-- A content node directly holds renderable data, and directly embeds child nodes if applicable
data class ContentNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // All child blocks, given a block and its associated block type supports nesting
    val children: Map<String, List<Node>>? = null,
) : Node

-- A reference node holds references to other entities, which can be resolved externally
-- This node can reference a list of entities. 
-- Or can reference an external block tree from another environment
data class ReferenceNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // Allow for lists of entities. But never a list of referenced blocks
    val reference: List<BlockReference<*>>,
) : Node
```

**Block** `core/models/block/Block.kt`

The block is the core data structure that holds all data for a given block instance.

```
data class Block(
    val id: UUID,
    val name: String?,
    val organisationId: UUID,
    -- The type definition for this block
    val type: BlockType,
    -- The metadata differs depending on if this block is a reference block or a content block
    -- All reference blocks must use the `Reference` Block Type for rendering 
    val payload: Metadata,
    val archived: Boolean,
    -- Validation only occurs on content blocks. We will never validate data on a referenced entity/block
    // If there are any validation errors with this block's payload
    val validationErrors: List<String>? = null,
    // Keep these hidden unless within an internal organisation context
    ...
) : Serializable, AuditableModel()
```

**Metadata** `core/models/block/structure/BlockMetadata.kt`

The block metadata defines the structure of data held within a block. There are two main types of metadata:

- Content Metadata: Holds all data directly within the block
    - This will store an abitrary JSON object that holds all data fields and attributes for this block.
    - Content will be accessed directly from this payload, validated upon saving via a comparison with the schema. And
      each attribute will have an associated data path for access.
        - An example data path could be: "$.data/project/budget"
            - This would then access the `budget` field within the `project` object inside the `data` JSON object.
          ```
            {
                "data": {
                    "project": {
                        "budget": 10000,
                        ...
                    }
                }
            }
            ```

- Reference Metadata:
    - This metadata will hold both the reference to the external entity or block. But will further filter and refine
      what attributes are taken from it and displayed.

```
sealed interface Metadata {
    val kind: BlockMetadataType
    val meta: BlockMeta
}

data class BlockContentMetadata(
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val data: JsonObject = emptyMap(),
    override val kind: BlockMetadataType = BlockMetadataType.CONTENT,
    override val meta: BlockMeta = BlockMeta()
) : Metadata

data class ReferenceMetadata(
    // Lazy v Eager loading for Block Building Operations to save on performance
    val fetchType: FetchType = FetchType.LAZY,
    val items: List<ReferenceItem>,
    override val kind: BlockMetadataType = BlockMetadataType.REFERENCE,
    val presentation: Presentation = Presentation.SUMMARY,
    val projection: Projection? = null,
    val sort: SortSpec? = null,
    val filter: FilterSpec? = null,
    val paging: PagingSpec? = null,
    override val meta: BlockMeta = BlockMeta()
) : Metadata

data class ReferenceItem(
    val type: EntityType,               // CLIENT | COMPANY | BLOCK | ...
    val id: UUID,
    val labelOverride: String? = null,
    val badge: String? = null,
)

enum class Presentation { SUMMARY, ENTITY, TABLE, GRID }

data class Projection(
    val fields: List<String> = emptyList(), // e.g., ["name","domain","contact.email"]
    val templateId: UUID? = null            // optional reusable template
)

data class SortSpec(val by: String, val dir: SortDir = SortDir.ASC)
enum class SortDir { ASC, DESC }
data class FilterSpec(
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val expr: Map<String, Any?> = emptyMap()
)

data class PagingSpec(val pageSize: Int = 20)

data class BlockMeta(
    val validationErrors: List<String> = emptyList(),
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val computedFields: JsonObject? = null,    // optional server-computed values for UI summaries
    val lastValidatedVersion: Int? = null      // BlockType.version used for last validation
)
```

**Block Type** `core/models/block/BlockType.kt`

The block type outlines the following structural attributes of a block:

```
data class BlockType(
    val id: UUID
    -- Unique block identifier
    val key: String,
    -- Current version of this block type. Increments upon updating structural design
    val version: Int,
    val name: String,
    
    -- Optional. Indicates if this block type is derived from another source block type
    val sourceId: UUID?,
    
    // Defines how this block type accepts nesting of other block types
    // Null implies no nesting allowed
    val nesting: BlockTypeNesting?,
    val description: String?,
    val organisationId: UUID?,
    val archived: Boolean,
    
    -- Validation scope for this block type. How data entry is validated when a block is made
    val strictness: BlockValidationScope,
    
    -- Indicates if this is a pre-generated block type. Or if it was created by a user/organisation
    val system: Boolean,
    
    -- The schema definition for all embedded attributes and data fields
    val schema: BlockSchema,
    
    -- The frontend rendering structure, instructions and definitions for the Form, and its rendered Components
    val display: BlockDisplay,
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?,
    val createdBy: UUID?,
    val updatedBy: UUID?,
)
```

### Nested Block Layouts

### Referencing External Entities