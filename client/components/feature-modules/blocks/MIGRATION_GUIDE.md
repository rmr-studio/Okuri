# Block System Migration Guide

## Overview

This guide documents the migration from the legacy `PlaygroundBlock` architecture to the new `BlockTree`-based system that properly aligns with the API schema.

## What Changed?

### Before (PlaygroundBlock)

```typescript
type PlaygroundBlock = {
    kind: "panel" | "block";
    id: string;
    title: string;
    tree: BlockTree;        // ❌ Wrapped but not used properly
    display: BlockRenderStructure;
    layout: LayoutRect;
    children?: PlaygroundBlock[];  // ❌ Redundant hierarchy
}
```

**Problems:**
- Data duplication between `PlaygroundBlock` and `BlockTree`
- Redundant child hierarchy (`children[]` vs `BlockNode.children`)
- UI concerns mixed with domain data
- Difficult to persist to database

### After (EditorEnvironment + BlockTree)

```typescript
interface EditorEnvironment {
    id: string;
    organisationId: string;
    blocks: EditorBlockInstance[];
    metadata: EditorEnvironmentMetadata;
}

interface EditorBlockInstance {
    tree: BlockTree;        // ✅ Single source of truth
    layout: EditorLayoutRect;  // ✅ Separate UI concern
    uiMetadata?: EditorBlockUIMetadata;  // ✅ Ephemeral UI state
}
```

**Benefits:**
- `BlockTree` is the single source of truth
- Clean separation: domain data vs UI layout
- Direct mapping to API schema
- Easy persistence and server sync

---

## Architecture Components

### 1. **EditorEnvironment**
Top-level container representing a collection of blocks (e.g., a client profile page, project dashboard).

**Location:** `interface/editor.interface.ts`

```typescript
interface EditorEnvironment {
    id: string;
    organisationId: string;
    blocks: EditorBlockInstance[];
    metadata: {
        name?: string;
        description?: string;
        createdAt?: string;
        updatedAt?: string;
    };
}
```

### 2. **EditorEnvironmentProvider**
React context that manages editor state and provides CRUD operations.

**Location:** `context/editor-environment-provider.tsx`

```typescript
const {
    environment,
    addBlock,
    removeBlock,
    updateBlock,
    insertNestedBlock,
    duplicateBlock,
    // ... more operations
} = useEditorEnvironment();
```

### 3. **EditorLayoutProvider** (Enhanced)
Tracks real-time GridStack positions and parent-child relationships.

**Location:** `context/editor-layout-provider.tsx`

```typescript
const {
    hierarchy,
    getParent,
    getChildren,
    getDescendants,
    registerGrid,
    // ... more queries
} = useEditorLayout();
```

### 4. **BlockTreeAdapter**
Utility for converting between `BlockTree` and GridStack.

**Location:** `util/block-tree.adapter.ts`

```typescript
// Convert blocks to GridStack widgets
const gridOptions = BlockTreeAdapter.toGridStackOptions(blocks);

// Extract layout from GridStack
const layout = BlockTreeAdapter.extractLayout(widget);

// Check nesting capability
const canNest = BlockTreeAdapter.canNest(tree);
```

### 5. **BlockTreeBuilder**
Helper utilities for creating and modifying `BlockTree` structures.

**Location:** `util/block-tree.builder.ts`

```typescript
// Create from BlockType
const tree = BlockTreeBuilder.fromBlockType(blockType, orgId, data);

// Add child to slot
const updated = BlockTreeBuilder.addChildToSlot(parent, "main", child);

// Update payload
const updated = BlockTreeBuilder.updatePayload(tree, { name: "New" });
```

---

## Migration Steps

### Step 1: Replace PlaygroundBlock with EditorBlockInstance

**Before:**
```typescript
const [blocks, setBlocks] = useState<PlaygroundBlock[]>([]);
```

**After:**
```typescript
// Use the provider instead
<EditorEnvironmentProvider organisationId="org-123">
    {/* Your components */}
</EditorEnvironmentProvider>

// Access via hook
const { getAllBlocks } = useEditorEnvironment();
const blocks = getAllBlocks(); // Returns EditorBlockInstance[]
```

### Step 2: Update Block Creation

**Before:**
```typescript
function createContactBlock(): PlaygroundBlock {
    return {
        kind: "panel",
        id: "block-123",
        title: "Contact",
        tree: { /* BlockTree */ },
        display: { /* Display */ },
        layout: { x: 0, y: 0, w: 6, h: 8 },
        children: [],
    };
}
```

**After:**
```typescript
// Use factories
import { createContactBlockTree } from './block-factories';

const tree = createContactBlockTree();
const { addBlock } = useEditorEnvironment();
addBlock(tree, { x: 0, y: 0, w: 6, h: 8 });
```

### Step 3: Update Nesting Logic

**Before:**
```typescript
// Manually managing children array
const parent = findBlockById(blocks, parentId);
parent.children.push(newChild);
```

**After:**
```typescript
// Use slot-based nesting
const { insertNestedBlock } = useEditorEnvironment();
insertNestedBlock({
    parentId: parent.tree.root.block.id,
    slotName: "main",  // From BlockType.display.render.components[].slots
    childTree: childBlockTree,
});
```

### Step 4: Update Deletion with Smart Hierarchy

**Before:**
```typescript
// Recursively deleted all children in tree
function removeBlockById(blocks: PlaygroundBlock[], id: string) {
    return blocks.filter(b => b.id !== id).map(b => ({
        ...b,
        children: removeBlockById(b.children, id)
    }));
}
```

**After:**
```typescript
// Uses EditorLayoutProvider for real-time hierarchy
const { removeBlock } = useEditorEnvironment();
removeBlock(blockId); // Only removes actual nested children
```

### Step 5: Update GridStack Integration

**Before:**
```typescript
const gridOptions = {
    children: blocks.map(b => ({
        id: b.id,
        x: b.layout.x,
        // ... manual mapping
    }))
};
```

**After:**
```typescript
const { getAllBlocks } = useEditorEnvironment();
const blocks = getAllBlocks();

const gridOptions = BlockTreeAdapter.toGridStackOptions(blocks, {
    cols: 12,
    rowHeight: 60,
    margin: 12,
});
```

---

## Using the New System

### Basic Setup

```typescript
import {
    EditorLayoutProvider,
    EditorEnvironmentProvider,
    BlockDemoV2
} from '@/components/feature-modules/blocks';

function MyApp() {
    return (
        <EditorLayoutProvider>
            <EditorEnvironmentProvider organisationId="org-123">
                <BlockDemoV2 />
            </EditorEnvironmentProvider>
        </EditorLayoutProvider>
    );
}
```

### Creating Custom Blocks

```typescript
import { BlockTreeBuilder } from '@/components/feature-modules/blocks';

function createCustomBlock() {
    // Option 1: From BlockType (when you have full schema)
    const tree = BlockTreeBuilder.fromBlockType(
        myBlockType,
        "org-123",
        { initialData: "value" }
    );

    // Option 2: Minimal (for testing)
    const tree = BlockTreeBuilder.createMinimal(
        "custom_block",
        "org-123",
        { content: "Hello World" }
    );

    return tree;
}
```

### Adding Blocks Programmatically

```typescript
function MyComponent() {
    const { addBlock, insertNestedBlock } = useEditorEnvironment();

    const handleAddTopLevel = () => {
        const tree = createCustomBlock();
        addBlock(tree, { x: 0, y: 0, w: 6, h: 8 });
    };

    const handleAddNested = () => {
        const childTree = createCustomBlock();
        insertNestedBlock({
            parentId: "parent-block-id",
            slotName: "main",
            childTree,
        });
    };

    return (
        <>
            <Button onClick={handleAddTopLevel}>Add Block</Button>
            <Button onClick={handleAddNested}>Add Nested</Button>
        </>
    );
}
```

### Querying and Updating

```typescript
function BlockEditor() {
    const {
        getBlock,
        updateBlock,
        updateLayout,
        duplicateBlock,
        removeBlock
    } = useEditorEnvironment();

    const handleUpdate = (blockId: string) => {
        const block = getBlock(blockId);
        if (!block) return;

        // Update data
        const updatedTree = BlockTreeBuilder.updatePayload(
            block.tree,
            { newField: "value" }
        );
        updateBlock(blockId, updatedTree);
    };

    const handleMove = (blockId: string) => {
        updateLayout(blockId, { x: 0, y: 10, w: 12, h: 8 });
    };

    return (
        <div>
            <Button onClick={() => handleUpdate("block-123")}>Update</Button>
            <Button onClick={() => duplicateBlock("block-123")}>Duplicate</Button>
            <Button onClick={() => removeBlock("block-123")}>Delete</Button>
        </div>
    );
}
```

---

## Data Flow

```
┌─────────────────────────────────────────┐
│  EditorEnvironmentProvider              │
│  ┌───────────────────────────────────┐  │
│  │  EditorEnvironment                │  │
│  │  ├─ blocks: EditorBlockInstance[] │  │
│  │  │  ├─ tree: BlockTree            │  │
│  │  │  └─ layout: LayoutRect         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
              ↓
    ┌─────────────────────┐
    │  BlockTreeAdapter   │
    │  (Converts to       │
    │   GridStack format) │
    └─────────────────────┘
              ↓
    ┌─────────────────────┐
    │  GridStack          │
    │  (Visual layout)    │
    └─────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│  EditorLayoutProvider                   │
│  (Tracks real-time hierarchy)           │
└─────────────────────────────────────────┘
```

---

## Key Differences

| Aspect | Old (PlaygroundBlock) | New (BlockTree) |
|--------|----------------------|-----------------|
| **Data Model** | Custom wrapper type | API-aligned BlockTree |
| **Hierarchy** | Flat `children[]` | Slot-based `children{}` |
| **Layout Storage** | Mixed with data | Separate `EditorBlockInstance` |
| **Nesting** | Any block can nest | Based on `BlockType.nesting` |
| **Deletion** | Tree-based (buggy) | Real-time hierarchy tracking |
| **Persistence** | Complex mapping | Direct API match |
| **Type Safety** | Partial | Full TypeScript |

---

## Testing the New System

### Demo Page

Use `BlockDemoV2` for the new architecture:

```typescript
import { BlockDemoV2 } from '@/components/feature-modules/blocks';

<BlockDemoV2 />
```

### Key Features to Test

1. **Add blocks** - Use toolbar buttons
2. **Move blocks** - Drag and drop
3. **Resize blocks** - Drag resize handles
4. **Nest blocks** - Drag block into a container (if supported)
5. **Delete parent** - Child moved out should survive
6. **Duplicate blocks** - Should create independent copies

---

## Migration Checklist

- [ ] Replace `PlaygroundBlock` imports with `EditorBlockInstance`
- [ ] Wrap components in `EditorEnvironmentProvider`
- [ ] Update block creation to use factories
- [ ] Replace manual nesting with `insertNestedBlock`
- [ ] Update deletion to use `removeBlock` (uses hierarchy)
- [ ] Convert GridStack integration to use `BlockTreeAdapter`
- [ ] Test nesting and deletion behavior
- [ ] Update persistence logic to use `exportToServer()`

---

## Next Steps

1. **Update existing pages** to use `EditorEnvironmentProvider`
2. **Fetch BlockTypes from API** instead of mocking
3. **Implement server persistence** using `exportToServer()`
4. **Add real-time collaboration** (optional)
5. **Build form mode** for editing block payloads
6. **Add undo/redo** using environment history

---

## Support

For questions or issues, refer to:
- Type definitions: `interface/editor.interface.ts`
- Utilities: `util/block-tree.adapter.ts` and `util/block-tree.builder.ts`
- Demo: `components/demo/block-demo-v2.tsx`
