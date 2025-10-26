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

# Block Layout

Blocks can be laid out and structured in a number of different ways to support maximum flexibility.

## Blocks

### Content Blocks

Content blocks hold renderable data directly within their payload. This data is validated against the block type's
schema, and can be directly interacted and edited with.
All content blocks have an associated ComponentNode within it's BlockType to define how it is rendered in the frontend.

**High Level Design**

```
Contact (Content block)
- Holds client fields directly (name, email, phone)
- No children (unless the BlockType declares nesting)
```

**Schema Definition**

```json
{
  "name": "Contact",
  "type": "OBJECT",
  "required": true,
  "properties": {
    "name": {
      "type": "STRING",
      "required": true
    },
    "email": {
      "type": "STRING",
      "format": "email"
    },
    "phone": {
      "type": "STRING"
    }
  }
}
```

**Data Payload Example**

```json
{
  "data": {
    "name": "Jane Doe",
    "email": "jane@acme.com",
    "phone": "+61 400 000 000"
  }
}
```

**Data Payload Bindings**

```json
{
  "component": "CONTACT_CARD",
  "bindings": [
    {
      "prop": "name",
      "source": {
        "type": "DataPath",
        "path": "$.data/name"
      }
    },
    {
      "prop": "email",
      "source": {
        "type": "DataPath",
        "path": "$.data/email"
      }
    },
    {
      "prop": "phone",
      "source": {
        "type": "DataPath",
        "path": "$.data/phone"
      }
    }
  ]
}
```

### Reference Blocks

All external information is held within a special type of block known as a Reference Block.
Reference blocks do not hold any direct data within their payload. Instead, they hold references to external entities or
other blocks.

When rendering a reference block, the system will resolve these references and fetch the necessary data from the
external source.

A Reference block can reference another block tree from a different environment, or can reference a list of external
entities.

**Block Referencing**

When referencing another block tree, The system will load the entire block tree and render it within the current
context.
The reference block is then able to alter the content of that block tree. Allowing the user to only display up to a
specific level of block,
or hide certain components.

**Entity References**

A reference block can also reference a list of external entities. These entities can be of any type, such as Clients,
Companies, Projects, etc.
A reference list can only reference entities of the same type within a single block, this is to allow for consistent
rendering, filtering, and sorting capabilities
When referencing external entities, the system will fetch the necessary data for each entity and render it according to
the specified presentation style.

#### Block Reference (single external BlockTree)

**High Level Design**

```
Company Overview
└── Reference Block (embeds external "Company" BlockTree)
```

**Metadata Definition**

```json
{
  "kind": "REFERENCE",
  "fetchPolicy": "EAGER"
  // Block tree must be loaded before overall environment is passed to the user
  "path": "$.block",
  "expandDepth": 2,
  "item": {
    "type": "BLOCK",
    "id": "00000000-0000-0000-0000-000000000001"
  }
}
```

**Data Payload Bindings**

```json
{
  "component": "BLOCK_REFERENCE",
  "bindings": [
    {
      "prop": "tree",
      "source": {
        "type": "BlockTreeRef",
        "expandDepth": 2
      }
    },
    {
      "prop": "title",
      "source": {
        "type": "DataPath",
        "path": "$.data/title"
      }
    }
  ]
}
```

**Notes**

- The embedded tree is read-only by default; edits navigate to the source context.
- Cycle protection prevents embedding a tree that (directly or indirectly) contains this reference block.

#### Entity Reference List (multiple external entities)

**High Level Design**

```
Contact Overview
└── Reference Block (Clients)
    - Renders a list of linked Client entities (not owned)
```

**Metadata Definition**

```json
{
  "kind": "REFERENCE",
  "fetchPolicy": "LAZY",
  // Defer hydration until component is visible
  "path": "$.items",
  "items": [
    {
      "type": "CLIENT",
      "id": "00000000-0000-0000-0000-0000000000a1"
    },
    {
      "type": "CLIENT",
      "id": "00000000-0000-0000-0000-0000000000a2"
    }
  ],
  "presentation": "SUMMARY",
  "projection": {
    // limit fields for network efficiency. Only these will be fetched and displayed
    "fields": [
      "name",
      "contact.email"
    ]
  },
  "sort": {
    "by": "name",
    "dir": "ASC"
  },
  "paging": {
    "pageSize": 20
  }
}
```

**Data Payload Bindings**

```json
{
  "component": "ENTITY_REFERENCE_LIST",
  "bindings": [
    {
      "prop": "rows",
      "source": {
        "type": "ResolvedRefs",
        "path": "$.items"
      }
    },
    {
      "prop": "emptyMessage",
      "source": {
        "type": "DataPath",
        "path": "$.data/emptyMessage"
      }
    }
  ]
}
```

**Notes**

- Missing entities render fallback rows with a warning badge.
- `LAZY` fetch defers hydration until the component is visible; use `EAGER` when required for above-the-fold content.
- `projection.fields` keeps network payloads small and stable for UI rendering.

# Nested Layouts

There are certain block types that support nesting of other blocks within them. This allows for complex layouts and
designs to be
created.
The ability to nest blocks is defined within the BlockType's nesting attribute, with outlines certain rules and
constraints for
how blocks can be nested.

### Block Layout Containers

A layout container is a special type of block that is designed to hold and organise other blocks within it.
These containers provide structure and layout capabilities, allowing users to create complex designs by nesting
other blocks within them.

**High Level Design**

```
Section (2-column)
├─ slot "contact":  Contact Card
└─ slot "address": Address List

// If another block gets dragged in. It would create a new slot automatically.
```

**Schema Definition**

```json
{
  "title": "Details",
  "layout": {
    "columns": 2,
    "responsive": {
      "sm": 1,
      "md": 2
    }
  }
}
```

**Data Payload Bindings**

```json
{
  "component": "SECTION",
  "bindings": [
    {
      "prop": "title",
      "source": {
        "type": "DataPath",
        "path": "$.data/title"
      }
    },
    {
      "prop": "contact",
      "source": {
        "type": "Slot",
        "slot": "contact"
      }
    },
    {
      "prop": "address",
      "source": {
        "type": "Slot",
        "slot": "address"
      }
    }
  ]
}
```

**Notes**

- Containers do not fetch data; they orchestrate child placement and responsive behavior.
- Validation for child types and max counts lives in the parent BlockType’s `nesting` rules.

### Block Lists

A block list is a specialised container that holds a list of blocks of a specific type. This allows for dynamic
lists of content to be created, such as a list of tasks, items, or entries.
Block lists can be configured to allow for adding, removing, and reordering of blocks within the list.

A block list ***may*** enforce homogeneous types (all children must be of the same block type) or heterogeneous types (
children can be of different block types) based on the configuration defined in the BlockType's schema.
The abilty to sort or flter would only be available for homogeneous lists.

**High Level Design**

```json
Contact (slot "addresses")
└── AddressList (slot "items")
├── Address #1
└── Address #2
```

**Schema Definition**

```json
{
  "title": "Addresses",
  "emptyMessage": "Add address",
  "allowedTypes": [
    "address"
  ],
  // enforce homogeneous list, or multiple for heterogeneous
  "maxItems": 100,
  "sort": {
    "by": "createdAt",
    "dir": "ASC"
  },
  // optional default sort => Would be null if multiple types allowed
  "layout": {
    "presentation": "CARD",
    // CARD | ROW | GRID
    "columns": 1
    // only relevant for GRID
  }
}
```

**Data Payload Bindings**

A list block would then have bindings similar to the following:

- A slot binding for the list items
    - This slot would be used to nest multiple Address blocks within the AddressList block as direct children.
- A data path binding for the title
    - This would be direct data stored in the list block.
- A data path binding for the empty message
    - This would also be direct data stored in the list block.

```json
{
  "component": "LIST",
  "bindings": [
    {
      "prop": "items",
      "source": {
        "type": "Slot",
        "slot": "items"
      }
    },
    {
      "prop": "title",
      "source": {
        "type": "DataPath",
        "path": "$.data/title"
      }
    },
    {
      "prop": "emptyMessage",
      "source": {
        "type": "DataPath",
        "path": "$.data/emptyMessage"
      }
    }
  ]
}
```

## Data Structures

Each block follows the same core structure:

**Block Tree** `core/models/block/BlockTree.kt`

The block tree is the root structure that contains all nodes for a given design.

```kotlin
data class BlockTree(
    val root: Node,
) : Referenceable<BlockTree> {... }

// Every Node in a Tree is either a ContentNode or ReferenceNode
sealed interface Node {
    val block: Block
    val warnings: List<String>
}

// A content node directly holds renderable data, and directly embeds child nodes if applicable
data class ContentNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // All child blocks, given a block and its associated block type supports nesting
    val children: Map<String, List<Node>>? = null,
) : Node

/**
 * A reference node holds references to other entities, which can be resolved externally
 * This node can reference a list of entities.
 * Or can reference an external block tree from another environment
 */
sealed interface ReferencePayload
data class EntityReference(val reference: List<Reference<*>>) : ReferencePayload
data class BlockTreeReference(val reference: Reference<BlockTree>) : ReferencePayload

data class ReferenceNode(
    override val block: Block,
    override val warnings: List<String> = emptyList(),
    // Allow for lists of entities. But never a list of referenced blocks
    val reference: ReferencePayload
) : Node
```

**Block** `core/models/block/Block.kt`

The block is the core data structure that holds all data for a given block instance.

```kotlin
data class Block(
    val id: UUID,
    val name: String?,
    val organisationId: UUID,
    // The type definition for this block
    val type: BlockType,
    // The metadata differs depending on if this block is a reference block or a content block
    // All reference blocks must use the `Reference` Block Type for rendering 
    val payload: Metadata,
    val archived: Boolean,
    // Validation only occurs on content blocks. We will never validate data on a referenced entity/block
    // If there are any validation errors with this block's payload
    val validationErrors: List<String>? = null,
    // Keep these hidden unless within an internal organisation context
    //...
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
          ```json
            {
                "data": {
                    "project": {
                        "budget": 10000
                        //...
                    }
                }
            }
            ```

- Reference Metadata:
    - This metadata will hold both the reference to the external entity or block. But will further filter and refine
      what attributes are taken from it and displayed.

```kotlin
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

sealed interface ReferenceMetadata : Metadata {
    val fetchPolicy: BlockReferenceFetchPolicy
    val path: String
}

/**
 * Metadata when a block is referencing a list of external entities
 */
data class EntityReferenceMetadata(
    override val kind: BlockMetadataType = BlockMetadataType.REFERENCE,
    override val fetchPolicy: BlockReferenceFetchPolicy = BlockReferenceFetchPolicy.LAZY,
    override val path: String = "\$.items",           // <— used by service to scope rows
    val items: List<ReferenceItem>,
    val presentation: Presentation = Presentation.SUMMARY,
    val projection: Projection? = null,
    val sort: SortSpec? = null,
    val filter: FilterSpec? = null,
    val paging: PagingSpec? = null,
    val allowDuplicates: Boolean = false,          // <— optional guard
    override val meta: BlockMeta = BlockMeta()
) : ReferenceMetadata

/**
 * Metadata when a block is referencing an external block.
 */
data class BlockReferenceMetadata(
    override val kind: BlockMetadataType = BlockMetadataType.REFERENCE,
    override val fetchPolicy: BlockReferenceFetchPolicy = BlockReferenceFetchPolicy.LAZY,
    override val meta: BlockMeta = BlockMeta(),
    override val path: String = "\$.block",
    val expandDepth: Int = 1,
    val item: ReferenceItem


) : ReferenceMetadata

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
    var validationErrors: List<String> = emptyList(),
    @param:Schema(type = "object", additionalProperties = Schema.AdditionalPropertiesValue.TRUE)
    val computedFields: JsonObject? = null,    // optional server-computed values for UI summaries
    var lastValidatedVersion: Int? = null      // BlockType.version used for last validation
)
```

**Block Type** `core/models/block/BlockType.kt`

The block type outlines the following structural attributes of a block:

```kotlin
data class BlockType(
    val id: UUID,
    // Unique block identifier
    val key: String,
    // Current version of this block type. Increments upon updating structural design
    val version: Int,
    val name: String,

    // Optional. Indicates if this block type is derived from another source block type
    val sourceId: UUID?,

    // Defines how this block type accepts nesting of other block types
    // Null implies no nesting allowed
    val nesting: BlockTypeNesting?,
    val description: String?,
    val organisationId: UUID?,
    val archived: Boolean,

    // Validation scope for this block type. How data entry is validated when a block is made
    val strictness: BlockValidationScope,

    // Indicates if this is a pre-generated block type. Or if it was created by a user/organisation
    val system: Boolean,

    // The schema definition for all embedded attributes and data fields
    val schema: BlockSchema,

    // The frontend rendering structure, instructions and definitions for the Form, and its rendered Components
    val display: BlockDisplay,
    val createdAt: ZonedDateTime?,
    val updatedAt: ZonedDateTime?,
    val createdBy: UUID?,
    val updatedBy: UUID?,
)
```





