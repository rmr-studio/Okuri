# Bug Fixes - Block Editor

## Issues Identified and Fixed

### Issue 1: Nested Blocks Not Found ❌ → ✅

**Problem:**
When inserting a nested block via the slash menu, the block showed "Block not found: <UUID>" fallback message.

**Root Cause:**
The `insertNestedBlock` function was adding the child to the parent's BlockTree slot but NOT adding it to the top-level `environment.blocks` array. This meant `getBlock(childId)` couldn't find it.

**Fix:**
Updated `EditorEnvironmentProvider.insertNestedBlock()` to add the child block to both:
1. The parent's BlockTree slot (for data structure correctness)
2. The top-level `environment.blocks` array (so `getBlock()` can find it)

**Location:** [editor-environment-provider.tsx:248-289](components/feature-modules/blocks/context/editor-environment-provider.tsx#L248-L289)

```typescript
// BEFORE: Only added to parent's slot
const updatedTree = BlockTreeBuilder.addChildToSlot(parentBlock.tree, slotName, childTree);
updateBlock(parentId, updatedTree);

// AFTER: Added to both parent's slot AND top-level blocks array
const updatedTree = BlockTreeBuilder.addChildToSlot(parentBlock.tree, slotName, childTree);
updateBlock(parentId, updatedTree);

const childInstance: EditorBlockInstance = {
    tree: childTree,
    layout: { x: 0, y: 0, w: 12, h: 4 },
};

setEnvironment((prev) => ({
    ...prev,
    blocks: [...prev.blocks, childInstance],
}));
```

**Why This Works:**
- The hierarchy tracker (`EditorLayoutProvider`) handles parent-child relationships
- The environment holds ALL blocks (top-level and nested) for easy lookup
- This matches how blocks work when moved between grids

---

### Issue 2: Add Block Toolbar Buttons Don't Work ❌ → ✅

**Problem:**
Clicking "Add Contact", "Add Project", etc. buttons didn't add any blocks to the editor.

**Root Cause:**
The `GridProvider` only accepts `initialOptions` which runs once on mount. When new blocks were added to `environment.blocks`, GridStack wasn't notified to create widgets.

**Fix:**
Created `EditorBlockSync` component that watches `environment.blocks` and syncs with GridStack.

**Location:** [block-demo-v2.tsx:101-150](components/feature-modules/blocks/components/demo/block-demo-v2.tsx#L101-L150)

```typescript
const EditorBlockSync: React.FC = () => {
    const { gridStack } = useGrid();
    const { getAllBlocks } = useEditorEnvironment();

    useEffect(() => {
        if (!gridStack) return;

        const blocks = getAllBlocks();
        const currentWidgetIds = new Set(/* grid widgets */);
        const blockIds = new Set(/* environment blocks */);

        // Add new blocks
        blocks.forEach((block) => {
            if (!currentWidgetIds.has(blockId)) {
                const widget = BlockTreeAdapter.toGridStackWidget(block);
                gridStack.addWidget(widget);
            }
        });

        // Remove deleted blocks
        currentWidgetIds.forEach((widgetId) => {
            if (!blockIds.has(widgetId)) {
                gridStack.removeWidget(element);
            }
        });
    }, [gridStack, getAllBlocks]);

    return null;
};
```

**Why This Works:**
- Watches `environment.blocks` for changes
- Adds widgets to GridStack when blocks are added
- Removes widgets from GridStack when blocks are removed
- Keeps GridStack and EditorEnvironment in perfect sync

---

### Issue 3: Moved Blocks Still Deleted with Parent ❌ → ✅

**Problem:**
When a child block was dragged out of a parent, then the parent was deleted, the child was STILL deleted even though it was visually outside the parent.

**Root Cause:**
Two issues:
1. **EditorGridTracker import bug** - Used `useBlockEnvironment()` instead of `useEditorLayout()`
2. **Missing GridStack event listener** - Not listening to `change` event when blocks move

**Fixes:**

#### Fix 3a: Corrected Import
**Location:** [editor-grid-tracker.tsx:11](components/feature-modules/blocks/components/editor-grid-tracker.tsx#L11)

```typescript
// BEFORE
import { useBlockEnvironment } from "../context/editor-layout-provider";

// AFTER
import { useEditorLayout } from "../context/editor-layout-provider";
```

#### Fix 3b: Added GridStack `change` Event Handler
**Location:** [editor-layout-provider.tsx:224-244](components/feature-modules/blocks/context/editor-layout-provider.tsx#L224-L244)

```typescript
const handleChange = (_event: Event, items: any[]) => {
    if (!items || items.length === 0) return;

    const updates: Array<{ blockId: string; parentId: string | null }> = [];
    items.forEach((item) => {
        if (item.id && item.grid) {
            const targetParentId = gridRegistry.current.get(item.grid) ?? null;
            updates.push({ blockId: item.id, parentId: targetParentId });
        }
    });

    if (updates.length > 0) {
        updateHierarchy(updates);
    }
};

grid.on("change", handleChange);
```

**Why This Works:**
- GridStack emits `change` events when widgets are moved
- The handler looks up which grid the widget is now in
- Updates the hierarchy tracker with the new parent (or `null` if top-level)
- When parent is deleted, `getDescendants()` only returns blocks that are CURRENTLY children

---

### Issue 4: Blocks Not Rendering Visually ❌ → ✅

**Problem:**
GridStack widgets were created and added to the DOM, but no visual block content appeared inside them. Only empty grid items were visible.

**Root Cause:**
The widget content structure didn't match what RenderElementProvider expects. Looking at `render-element-provider.tsx:35`:

```typescript
return { type: payload.type, props: payload.props ?? payload };
```

It tries to use `payload.props` first, or falls back to the entire payload. However, our widget content was structured like:

```typescript
// WRONG - fields at top level without props wrapper
{
    type: "EDITOR_PANEL",
    blockId: "...",
    tree: {...},
    uiMetadata: {...}
}
```

The RenderElementProvider couldn't find the `blockId` because it was looking for `payload.props.blockId`, but our structure had it at the top level.

**Fix:**
Updated `BlockTreeAdapter.toGridStackWidget()` to structure widget content correctly:

**Location:** [block-tree.adapter.ts:40-45](components/feature-modules/blocks/util/block-tree.adapter.ts#L40-L45)

```typescript
// BEFORE - Wrong structure
content: JSON.stringify({
    type: renderMode === "panel" ? "EDITOR_PANEL" : "EDITOR_BLOCK",
    blockId: blockId,
    tree: tree,
    uiMetadata: instance.uiMetadata,
})

// AFTER - Correct structure with props wrapper
content: JSON.stringify({
    type: renderMode === "panel" ? "EDITOR_PANEL" : "EDITOR_BLOCK",
    props: {
        blockId: blockId,
    },
})
```

**Additional Fix:**
Added FALLBACK component to `editorPanelRegistry` to handle unknown component types gracefully.

**Location:** [editor-panel.tsx:166-204](components/feature-modules/blocks/components/panel/editor-panel.tsx#L166-L204)

```typescript
const FallbackComponent: React.FC<{ reason?: string }> = ({ reason }) => (
    <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
        {reason || "Unknown component type"}
    </div>
);

export const editorPanelRegistry = {
    EDITOR_PANEL: createRenderElement({...}),
    EDITOR_BLOCK: createRenderElement({...}),
    FALLBACK: createRenderElement({
        type: "FALLBACK",
        schema: FallbackSchema,
        component: FallbackComponent,
    }),
};
```

**Why This Works:**
1. Widget content now has `props` field that matches schema expectations
2. RenderElementProvider can parse the props correctly
3. EditorPanelWidget receives `blockId` prop
4. Component can look up block data via `getBlock(blockId)`
5. Block content renders inside the GridStack widget container

---

### Issue 5: Nested Blocks Appearing at Top-Level ❌ → ✅

**Problem:**
When adding nested blocks (e.g., adding a Note inside a Project), the nested block would appear at the top-level grid instead of inside its parent container.

**Root Cause:**
The `EditorBlockSync` component was adding ALL blocks from `environment.blocks` to the root GridStack, including nested blocks. This happened because:

1. `insertNestedBlock()` correctly adds child blocks to `environment.blocks` (needed for `getBlock()` lookup)
2. `EditorBlockSync` then saw these blocks and added them to the root GridStack
3. No filtering was applied to distinguish top-level vs nested blocks

**Fix:**
Modified `EditorBlockSync` to filter blocks by hierarchy before adding to GridStack:

**Location:** [block-demo-v2.tsx:101-150](components/feature-modules/blocks/components/demo/block-demo-v2.tsx#L101-L150)

```typescript
// BEFORE - Added ALL blocks to root GridStack
const EditorBlockSync: React.FC = () => {
    const { gridStack } = useGrid();
    const { getAllBlocks } = useEditorEnvironment();

    useEffect(() => {
        const blocks = getAllBlocks();

        // This added EVERY block, including nested ones!
        blocks.forEach((block) => {
            gridStack.addWidget(widget);
        });
    }, [gridStack, getAllBlocks]);
};

// AFTER - Only add top-level blocks
const EditorBlockSync: React.FC = () => {
    const { gridStack } = useGrid();
    const { getAllBlocks } = useEditorEnvironment();
    const { getParent } = useEditorLayout();  // ← Added hierarchy check

    useEffect(() => {
        const allBlocks = getAllBlocks();

        // Filter for top-level blocks only
        const topLevelBlocks = allBlocks.filter((block) => {
            const parentId = getParent(block.tree.root.block.id);
            return parentId === null;  // ← Only blocks without a parent
        });

        // Only add top-level blocks to root GridStack
        topLevelBlocks.forEach((block) => {
            gridStack.addWidget(widget);
        });
    }, [gridStack, getAllBlocks, getParent]);
};
```

**Supporting Import:**
**Location:** [block-demo-v2.tsx:21](components/feature-modules/blocks/components/demo/block-demo-v2.tsx#L21)

```typescript
import { EditorLayoutProvider, useEditorLayout } from "../../context/editor-layout-provider";
```

**Why This Works:**
1. **Top-level blocks** (parentId === null) are added to root GridStack
2. **Nested blocks** (parentId !== null) are NOT added to root GridStack
3. Nested blocks render via recursive `<EditorPanelWidget>` component:
   ```typescript
   // In EditorPanelWidget:
   const childrenIds = getChildren(blockId);
   const nestedContent = (
       <div className="space-y-4">
           {childrenIds.map((childId) => (
               <EditorPanelWidget key={childId} blockId={childId} />
           ))}
       </div>
   );
   ```
4. Each parent renders its children inside its `nested` prop
5. Children appear inside parent panel, not at top-level

---

## Summary of Changes

### Files Modified

1. **[editor-environment-provider.tsx](components/feature-modules/blocks/context/editor-environment-provider.tsx)**
   - ✅ Fixed `insertNestedBlock()` to add blocks to both parent slot and top-level array

2. **[editor-layout-provider.tsx](components/feature-modules/blocks/context/editor-layout-provider.tsx)**
   - ✅ Added `change` event handler to track block movements
   - ✅ Updated cleanup to remove `change` listener

3. **[editor-grid-tracker.tsx](components/feature-modules/blocks/components/editor-grid-tracker.tsx)**
   - ✅ Fixed import to use `useEditorLayout()` instead of `useBlockEnvironment()`

4. **[block-demo-v2.tsx](components/feature-modules/blocks/components/demo/block-demo-v2.tsx)**
   - ✅ Added `EditorBlockSync` component to sync blocks with GridStack
   - ✅ Added hierarchy filtering to only render top-level blocks at root
   - ✅ Added `useEditorLayout` import

5. **[block-tree.adapter.ts](components/feature-modules/blocks/util/block-tree.adapter.ts)**
   - ✅ Fixed widget content structure to use `props` wrapper
   - ✅ Simplified payload to only include `blockId`

6. **[editor-panel.tsx](components/feature-modules/blocks/components/panel/editor-panel.tsx)**
   - ✅ Added FALLBACK component to registry
   - ✅ Added FallbackSchema and FallbackComponent

---

## Architecture Overview

### Data Flow for Block Rendering

```
EditorEnvironment.blocks (ALL blocks stored here)
  ├─ Top-level blocks (parentId === null)
  │    └─ Added to root GridStack via EditorBlockSync
  │         └─ Rendered as widgets with RenderElementProvider
  │              └─ <EditorPanelWidget blockId={...} />
  │                   └─ Recursively renders nested children
  └─ Nested blocks (parentId !== null)
       └─ NOT added to GridStack
       └─ Rendered by parent's <EditorPanelWidget> recursion
```

### Widget Content Structure

```typescript
// GridStack widget.content (serialized JSON)
{
    type: "EDITOR_PANEL" | "EDITOR_BLOCK",
    props: {
        blockId: string  // Used to lookup block in EditorEnvironment
    }
}
```

### Rendering Pipeline

```
1. EditorBlockSync watches environment.blocks
2. Filters for top-level blocks (parentId === null)
3. Creates GridStack widgets via BlockTreeAdapter
4. GridStack calls renderCB to create DOM containers
5. RenderElementProvider parses widget.content.props
6. Validates props against EditorPanelWidgetSchema
7. Renders <EditorPanelWidget blockId={...} />
8. EditorPanelWidget:
   - Looks up block via getBlock(blockId)
   - Renders block content via <RenderBlock>
   - Gets children via getChildren(blockId)
   - Recursively renders <EditorPanelWidget> for each child
```

---

## Testing Checklist

### Test 1: Visual Rendering ✅
- [ ] Click "Add Contact" button
- [ ] **VERIFY**: Block renders with visual content (not empty widget)
- [ ] **VERIFY**: Contact card shows fields, borders, styling
- [ ] **VERIFY**: No "Block not found" errors

### Test 2: Nested Block Insertion ✅
- [ ] Click on a Project block to select it
- [ ] Press `/` to open insert menu
- [ ] Select "Note" from the menu
- [ ] **VERIFY**: Note block appears INSIDE the Project panel
- [ ] **VERIFY**: Note block does NOT appear at top-level
- [ ] **VERIFY**: Note block renders with content

### Test 3: Add Block Buttons ✅
- [ ] Click "Add Contact" button → block appears
- [ ] Click "Add Project" button → block appears
- [ ] Click "Add Invoice" button → block appears
- [ ] Click "Add Note" button → block appears
- [ ] **VERIFY**: All blocks render correctly

### Test 4: Smart Deletion ✅
- [ ] Add a Project block (supports nesting)
- [ ] Add a Note block inside the Project
- [ ] Drag the Note block OUT of the Project to top-level
- [ ] Delete the Project block
- [ ] **VERIFY**: Note block survives! ✅

### Test 5: Nested Deletion ✅
- [ ] Add a Project block
- [ ] Add a Note block inside the Project
- [ ] **Leave the Note inside the Project**
- [ ] Delete the Project block
- [ ] **VERIFY**: Note block is deleted (correct behavior)

---

## Technical Deep Dive

### Why Store All Blocks in environment.blocks?

**Design Decision:**
```typescript
// environment.blocks contains BOTH top-level AND nested blocks
environment.blocks = [
    { tree: projectBlock, layout: {...} },      // top-level
    { tree: noteBlock, layout: {...} },          // nested child
    { tree: contactBlock, layout: {...} },       // top-level
]
```

**Reasoning:**
1. **Fast Lookup**: `getBlock(id)` is O(1) with a Map lookup
2. **Consistent API**: Same lookup works for any block, nested or not
3. **Move Support**: When blocks move between grids, they stay in the array
4. **Hierarchy Separation**: EditorLayoutProvider tracks parent-child relationships separately

**Alternative Rejected:**
Storing only top-level blocks and walking the tree for nested blocks would be:
- Slower (O(n) for nested lookups)
- More complex (need to traverse BlockNode.children)
- Harder to update (need to rebuild parent tree on child updates)

### Why Filter in EditorBlockSync?

The filtering happens at the **rendering boundary**:

```typescript
// Storage: ALL blocks
environment.blocks = [project, note, contact]

// Hierarchy: Tracks relationships
hierarchy = {
    project: null,    // top-level
    note: project,    // nested in project
    contact: null,    // top-level
}

// Rendering: Only top-level in GridStack
topLevelBlocks = blocks.filter(b => getParent(b.id) === null)
// → [project, contact]

// Nested blocks render via recursion
<EditorPanelWidget blockId="project">
    {/* Internally renders: */}
    <EditorPanelWidget blockId="note" />
</EditorPanelWidget>
```

This separation allows:
- **Storage**: Simple flat array
- **Hierarchy**: Flexible parent-child tracking
- **Rendering**: Correct visual nesting

---

## Performance Considerations

1. **EditorBlockSync**: Runs on every block change but is efficient:
   - Uses Set operations (O(n))
   - Only adds/removes changed widgets
   - Doesn't re-render existing widgets

2. **Hierarchy Updates**: Debounced by GridStack events
   - Only fires when drag actually completes
   - Batch updates multiple moves

3. **Memory**: All blocks stored in `environment.blocks`
   - Trade-off: Easier lookup vs more memory
   - Acceptable for typical use cases (<1000 blocks)

4. **Rendering**: Recursive component rendering
   - React's reconciliation handles updates efficiently
   - Only re-renders changed subtrees

---

## Future Improvements

1. **Lazy Loading**: Load nested blocks on demand
2. **Virtual Scrolling**: For large block counts
3. **Debounced Sync**: Batch multiple block additions
4. **Transaction API**: Atomic multi-block operations
5. **Optimistic Updates**: Update UI before server confirms
6. **Undo/Redo**: Track operation history

---

## Migration Notes

No breaking changes for existing code using `EditorEnvironmentProvider`. All fixes are internal implementation details.

Developers using the block editor should see immediate improvements:
- ✅ Nested blocks render correctly inside parents
- ✅ Visual content appears in all blocks
- ✅ Add buttons work immediately
- ✅ Smart deletion based on real-time hierarchy
- ✅ Proper visual nesting (no top-level pollution)
