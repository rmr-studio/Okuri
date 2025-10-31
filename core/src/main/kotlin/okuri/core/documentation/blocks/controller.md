## Overview

Created two new controller classes for managing block relationships and references:

- **BlockChildrenController** - Manages parent-child block relationships (owned nesting)
- **BlockReferencesController** - Manages entity and block references (linked references)

All controllers follow the same structure, documentation style, and patterns as the
existing [BlockController](../../controller/block/BlockController.kt).

---

## Created Files

### Request DTOs

1. **AddChildRequest.kt** - For adding a single child to a parent
2. **AddChildrenBulkRequest.kt** - For bulk child additions
3. **MoveChildRequest.kt** - For moving children between slots/positions
4. **ReorderChildrenRequest.kt** - For reordering children within a slot
5. **UpsertEntityReferencesRequest.kt** - For updating entity reference lists
6. **UpsertBlockReferenceRequest.kt** - For updating single block references

### Controllers

1. **BlockChildrenController.kt** - 6 endpoints for parent-child management
2. **BlockReferencesController.kt** - 5 endpoints for reference management

---

## BlockChildrenController Endpoints

### ✅ Endpoints with Partial Implementation Possible

#### 1. POST /blocks/{parentId}/children

**Status**: Skeleton only
**Purpose**: Add a single child block to a parent's slot
**Service Method Available**: `BlockChildrenService.addChild(child, parentId, slot, index, nesting)`

**Missing Implementation Requirements**:

- Need to load parent block entity to extract `parent.type.nesting` configuration
- `addChild()` requires `BlockTypeNesting` parameter which must come from parent's type
- Need to load child block entity from `childId` in request

**Suggested Approach**:

```kotlin
val parent = blockRepository.findById(parentId).orElseThrow()
val child = blockRepository.findById(request.childId).orElseThrow()
val nesting = parent.type.nesting

val result = blockChildrenService.addChild(
    child = child,
    parentId = parentId,
    slot = request.slot,
    index = request.orderIndex ?: 0,
    nesting = nesting
)
```

---

#### 2. PATCH /blocks/{parentId}/children/{childId}/move

**Status**: Skeleton only
**Purpose**: Move a child within parent or across slots
**Service Method Available**: `BlockChildrenService.moveChildToSlot(childId, fromSlot, toSlot, toIndex, nesting)`

**Missing Implementation Requirements**:

- Need to determine `fromSlot` by querying current edge for the child
- Need to load parent and extract nesting configuration
- Need method to query: `edgeRepository.findByParentIdAndChildId(parentId, childId)`

**Suggested Approach**:

```kotlin
val currentEdge = edgeRepository.findByParentIdAndChildId(parentId, childId) ?: throw NotFoundException()
val parent = blockRepository.findById(parentId).orElseThrow()
val nesting = parent.type.nesting

blockChildrenService.moveChildToSlot(
    childId = childId,
    fromSlot = currentEdge.slot,
    toSlot = request.toSlot,
    toIndex = request.toIndex,
    nesting = nesting
)
```

---

#### 3. PATCH /blocks/{parentId}/children/reorder

**Status**: Skeleton only
**Purpose**: Reorder children within a single slot
**Service Method Available**: `BlockChildrenService.replaceSlot(parentId, slot, orderedChildIds, nesting)`

**Missing Implementation Requirements**:

- Need to load parent and extract nesting configuration
- `replaceSlot()` performs validation and reordering

**Suggested Approach**:

```kotlin
val parent = blockRepository.findById(parentId).orElseThrow()
val nesting = parent.type.nesting

blockChildrenService.replaceSlot(
    parentId = parentId,
    slot = request.slot,
    orderedChildIds = request.order,
    nesting = nesting
)
```

---

#### 4. DELETE /blocks/{parentId}/children/{childId}

**Status**: Skeleton only
**Purpose**: Remove a child from parent without deleting the block
**Service Method Available**: `BlockChildrenService.removeChild(parentId, slot, childId)`

**Missing Implementation Requirements**:

- Need to determine which slot the child is in
- Requires querying edge: `edgeRepository.findByParentIdAndChildId(parentId, childId)`

**Suggested Approach**:

```kotlin
val edge = edgeRepository.findByParentIdAndChildId(parentId, childId) ?: throw NotFoundException()

blockChildrenService.removeChild(
    parentId = parentId,
    slot = edge.slot,
    childId = childId
)
```

---

### ❌ Endpoints Requiring New Service Methods

#### 5. POST /blocks/{parentId}/children:bulk

**Status**: Skeleton only
**Purpose**: Add multiple children at once
**Service Method Needed**: `BlockChildrenService.addChildrenBulk(parentId, slot, children, nesting)`

**Current Workaround**: Could iterate and call `addChild()` for each, but this:

- Requires transaction management
- Needs partial failure handling
- Less efficient than a dedicated bulk method

**Recommended Service Method**:

```kotlin
@Transactional
fun addChildrenBulk(
    parentId: UUID,
    slot: String,
    children: List<ChildOrderItem>,
    nesting: BlockTypeNesting
): List<BlockChildEntity> {
    // Validate all children upfront
    // Add all children in single transaction
    // Normalize indices atomically
}
```

---

#### 6. DELETE /blocks/{parentId}/children?slot={slot}

**Status**: Skeleton only
**Purpose**: Clear all children from a specific slot
**Service Method Needed**: `BlockChildrenService.detachChildrenBySlot(parentId, slot)`

**Notes**:

- This method was attempted in tests but never implemented in the service
- Should detach all children in the slot and clear their parent pointers

**Recommended Service Method**:

```kotlin
@Transactional
fun detachChildrenBySlot(parentId: UUID, slot: String) {
    val edges = edgeRepository.findByParentIdAndSlotOrderByOrderIndexAsc(parentId, slot)
    if (edges.isEmpty()) return

    val childIds = edges.map { it.childId }
    val children = blockRepository.findAllById(childIds)

    // Delete edges
    edgeRepository.deleteAllInBatch(edges)
}
```

---

## BlockReferencesController Endpoints

### ✅ Endpoints with Partial Implementation Possible

#### 1. PUT /blocks/{id}/refs:links

**Status**: Skeleton only
**Purpose**: Update entity reference list (delta upsert)
**Service Method Available**: `BlockReferenceService.upsertLinksFor(block, meta: EntityReferenceMetadata)`

**Missing Implementation Requirements**:

- Need to load block entity and verify it has `EntityReferenceMetadata` payload
- Need to construct complete `EntityReferenceMetadata` from request, including:
    - `items` (from request)
    - `path` (from request.pathPrefix or default "$.items")
    - `allowDuplicates` (from existing metadata or default false)
    - `fetchPolicy` (preserve from existing metadata)
    - `meta` (BlockMeta)

**Suggested Approach**:

```kotlin
val block = blockRepository.findById(id).orElseThrow()
require(block.payload is EntityReferenceMetadata) {
    "Block must have EntityReferenceMetadata payload"
}

val existingMeta = block.payload as EntityReferenceMetadata
val metadata = EntityReferenceMetadata(
    items = request.items,
    path = request.pathPrefix ?: "$.items",
    allowDuplicates = existingMeta.allowDuplicates,
    fetchPolicy = existingMeta.fetchPolicy,
    meta = existingMeta.meta
)

blockReferenceService.upsertLinksFor(block, metadata)
```

---

#### 2. PUT /blocks/{id}/refs:block

**Status**: Skeleton only
**Purpose**: Update single block reference
**Service Method Available**: `BlockReferenceService.upsertBlockLinkFor(block, meta: BlockReferenceMetadata)`

**Missing Implementation Requirements**:

- Need to load block entity and verify it has `BlockReferenceMetadata` payload
- Need to verify `request.item.type == EntityType.BLOCK_TREE`
- Need to construct complete `BlockReferenceMetadata` from request

**Suggested Approach**:

```kotlin
val block = blockRepository.findById(id).orElseThrow()
require(block.payload is BlockReferenceMetadata) {
    "Block must have BlockReferenceMetadata payload"
}
require(request.item.type == EntityType.BLOCK_TREE) {
    "Item must have type BLOCK for block references"
}

val existingMeta = block.payload as BlockReferenceMetadata
val metadata = BlockReferenceMetadata(
    item = request.item,
    path = request.path ?: "$.block",
    fetchPolicy = existingMeta.fetchPolicy,
    meta = existingMeta.meta
)

blockReferenceService.upsertBlockLinkFor(block, metadata)
```

---

#### 3. GET /blocks/{id}/refs

**Status**: Skeleton only
**Purpose**: Get resolved references with optional fetch policy override
**Service Methods Available**:

- `BlockReferenceService.findListReferences(blockId, meta: EntityReferenceMetadata): List<Reference<*>>`
- `BlockReferenceService.findBlockLink(blockId, meta: BlockReferenceMetadata): Reference<Block>`

**Missing Implementation Requirements**:

- Need to determine block's metadata type (EntityReferenceMetadata or BlockReferenceMetadata)
- Need to handle different return types based on metadata type
- Need to apply fetch policy override if provided
- Need polymorphic response handling

**Suggested Approach**:

```kotlin
val block = blockRepository.findById(id).orElseThrow()

return when (val payload = block.payload) {
    is EntityReferenceMetadata -> {
        val meta = if (policy != null) {
            payload.copy(fetchPolicy = policy)
        } else payload

        val references = blockReferenceService.findListReferences(id, meta)
        ResponseEntity.ok(references)
    }
    is BlockReferenceMetadata -> {
        val meta = if (policy != null) {
            payload.copy(fetchPolicy = policy)
        } else payload

        val reference = blockReferenceService.findBlockLink(id, meta)
        ResponseEntity.ok(reference)
    }
    else -> ResponseEntity.badRequest().build()
}
```

---

### ❌ Endpoints Requiring New Service Methods

#### 4. DELETE /blocks/{id}/refs

**Status**: Skeleton only
**Purpose**: Clear all references from a block
**Service Method Needed**: `BlockReferenceService.clearAllReferences(blockId: UUID)`

**Current Workaround**: Can use repository directly:

```kotlin
val refs = blockReferenceRepository.findByBlockIdAndPathPrefix(id, "$")
blockReferenceRepository.deleteAllInBatch(refs)
```

**Recommended Service Method**:

```kotlin
@Transactional
fun clearAllReferences(blockId: UUID) {
    val refs = blockReferenceRepository.findByParentId(blockId) // Need this method in repo
    if (refs.isNotEmpty()) {
        blockReferenceRepository.deleteAllInBatch(refs)
    }
}
```

---

#### 5. DELETE /blocks/{id}/refs/{entityType}/{entityId}

**Status**: Skeleton only
**Purpose**: Remove a single reference from a block
**Service Method Needed**: `BlockReferenceService.removeReference(blockId, entityType, entityId, path?)`

**Complex Requirements**:

- Query references by blockId + entityType + entityId
- If multiple found and path is null, return 400 (ambiguous - for lists with allowDuplicates)
- If path provided, filter to that specific path
- Delete matching reference(s)
- For lists, renumber remaining items in the path prefix

**Recommended Service Method**:

```kotlin
@Transactional
fun removeReference(
    blockId: UUID,
    entityType: EntityType,
    entityId: UUID,
    path: String? = null
) {
    // Query matching references
    val allMatches = blockReferenceRepository.findByParentIdAndEntityTypeAndEntityId(
        blockId, entityType, entityId
    )

    if (allMatches.isEmpty()) throw NotFoundException()

    // Filter by path if provided, else ensure single match
    val toDelete = if (path != null) {
        allMatches.filter { it.path == path }
    } else {
        require(allMatches.size == 1) {
            "Multiple references found. Specify path parameter to disambiguate."
        }
        allMatches
    }

    // Delete the reference(s)
    blockReferenceRepository.deleteAllInBatch(toDelete)

    // Renumber remaining items if this was in a list
    // Extract path prefix (e.g., "$.items" from "$.items[2]")
    val pathPrefix = path?.substringBeforeLast("[") ?: return
    val remaining = blockReferenceRepository.findByBlockIdAndPathPrefix(blockId, pathPrefix)

    // Renumber to 0..n-1
    remaining.sortedBy { it.orderIndex }.forEachIndexed { index, ref ->
        val newPath = "$pathPrefix[$index]"
        if (ref.path != newPath || ref.orderIndex != index) {
            blockReferenceRepository.save(ref.copy(path = newPath, orderIndex = index))
        }
    }
}
```

---

## Missing Repository Methods

Some implementations would benefit from additional repository queries:

### BlockChildrenRepository

```kotlin
// Find edge by parent and child (for determining slot)
fun findByParentIdAndChildId(parentId: UUID, childId: UUID): BlockChildEntity?
```

### BlockReferenceRepository

```kotlin
// Find all references for a block (for clearAllReferences)
fun findByParentId(parentId: UUID): List<BlockReferenceEntity>

// Find references by entity type and ID (for removeReference)
fun findByParentIdAndEntityTypeAndEntityId(
    parentId: UUID,
    entityType: EntityType,
    entityId: UUID
): List<BlockReferenceEntity>
```

---

## Implementation Priority

### High Priority (Can implement immediately with minor additions)

1. **POST /blocks/{parentId}/children** - Just needs parent loading
2. **PATCH /blocks/{parentId}/children/reorder** - Just needs parent loading
3. **PUT /blocks/{id}/refs:links** - Just needs metadata construction
4. **PUT /blocks/{id}/refs:block** - Just needs metadata construction

### Medium Priority (Needs repository query methods)

5. **PATCH /blocks/{parentId}/children/{childId}/move** - Needs `findByParentIdAndChildId`
6. **DELETE /blocks/{parentId}/children/{childId}** - Needs `findByParentIdAndChildId`
7. **GET /blocks/{id}/refs** - Needs polymorphic response handling

### Low Priority (Needs new service methods)

8. **POST /blocks/{parentId}/children:bulk** - Needs `addChildrenBulk()` service method
9. **DELETE /blocks/{parentId}/children?slot** - Needs `detachChildrenBySlot()` service method
10. **DELETE /blocks/{id}/refs** - Needs `clearAllReferences()` service method
11. **DELETE /blocks/{id}/refs/{entityType}/{entityId}** - Needs `removeReference()` service method

---

## API Usage Examples

### Add a child to a parent

```http
POST /api/v1/blocks/550e8400-e29b-41d4-a716-446655440000/children
Content-Type: application/json

{
  "childId": "550e8400-e29b-41d4-a716-446655440001",
  "slot": "addresses",
  "orderIndex": 0
}
```

### Reorder children in a slot

```http
PATCH /api/v1/blocks/550e8400-e29b-41d4-a716-446655440000/children/reorder
Content-Type: application/json

{
  "slot": "items",
  "order": [
    "550e8400-e29b-41d4-a716-446655440003",
    "550e8400-e29b-41d4-a716-446655440002",
    "550e8400-e29b-41d4-a716-446655440001"
  ]
}
```

### Update entity references

```http
PUT /api/v1/blocks/550e8400-e29b-41d4-a716-446655440000/refs:links
Content-Type: application/json

{
  "items": [
    { "type": "CLIENT", "id": "550e8400-e29b-41d4-a716-446655440010" },
    { "type": "CLIENT", "id": "550e8400-e29b-41d4-a716-446655440011" }
  ],
  "pathPrefix": "$.clients"
}
```

### Get references (EAGER mode)

```http
GET /api/v1/blocks/550e8400-e29b-41d4-a716-446655440000/refs?policy=EAGER
```

---

## Testing Recommendations

Once implementations are complete, create integration tests for:

1. **Parent-child operations**:
    - Adding children with validation
    - Reordering within slots
    - Moving between slots
    - Bulk operations
    - Validation errors (wrong org, type not allowed, max children)

2. **Reference operations**:
    - Entity list upsert with delta changes
    - Block reference switching
    - LAZY vs EAGER fetch policies
    - Duplicate handling
    - Missing/unsupported entity warnings

3. **Edge cases**:
    - Concurrent modifications
    - Orphaned blocks after detachment
    - Reference integrity after deletions
    - Cycle prevention in reparenting

---

## Summary

**Controllers Created**: 2
**Endpoints Created**: 11
**Endpoints Ready for Implementation**: 4 (36%)
**Endpoints Needing Repository Methods**: 3 (27%)
**Endpoints Needing New Service Methods**: 4 (36%)

All controllers are fully documented with OpenAPI annotations and follow Spring Boot best practices. The skeleton
implementations clearly mark missing requirements with `TODO()` statements and detailed comments explaining what's
needed.
