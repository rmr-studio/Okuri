# Block Building Environment - Implementation Plan

**Created:** 2025-10-25
**Status:** Awaiting Approval

---

## Task Analysis Summary

After analyzing the three tasks, I have identified the following implementation approach. Each task is dependent on the previous one being completed successfully.

### Task Dependencies

```
Task 1: BlockEnvironmentProvider
    � (provides foundation for real-time hierarchy tracking)
Task 2: Smart Block Deletion
    � (enables data editing features)
Task 3: Data Form Mode
```

---

## Task 1: Removal of Playground Environment & Creation of BlockEnvironmentProvider

### Requirements Analysis

**Current State:**
- `PlaygroundContext` in `block-demo.tsx` (lines 49-206) manages all block interactions
- Uses `PlaygroundBlock` type (lines 34-45) which wraps `BlockTree` with additional UI metadata
- Stores blocks in a hierarchical structure with `children?: PlaygroundBlock[]`
- Has methods: `insertPanel`, `insertNested`, `duplicatePanel`, `removePanel`, `applyLayouts`

**Issues with Current Approach:**
1. **Mock Data Dependency**: Uses factory functions (`createContactBlock`, `createProjectMetricsBlock`, etc.) with hardcoded demo data
2. **Duplicate Data Structures**: `PlaygroundBlock` duplicates information already in `BlockTree`
3. **Layout Tracking**: Layout is stored separately in `layout: LayoutRect` instead of being derived from GridStack
4. **Children Array**: Stores `children?: PlaygroundBlock[]` which duplicates the nesting already in `BlockTree.root.children`
5. **Demo-Only**: Not designed for integration with real API data

**Requirements:**
1.  Create `BlockEnvironmentProvider` that replaces `PlaygroundContext`
2.  Use `BlockTree` as the single source of truth (no wrapper types)
3.  All blocks wrapped in Panel (for UI chrome: delete, edit, insert)
4.  Track real-time layout structure (for smart deletion)
5.  Handle nested block promotion to top-level when moved out
6.  Expose environment access methods (block structure, nested children, etc.)

### Questions for Clarification

Before proceeding, I need clarification on the following:

#### Q1: BlockTree Storage Strategy

The `BlockTree` type has a hierarchical structure with `BlockNode.children` which stores nested blocks by slot name. However, the current playground stores all blocks (including nested ones) in a flat structure.

**Option A: Flat Storage (Current Playground Pattern)**
- Store all blocks in a flat array: `blocks: BlockTree[]`
- Track parent-child relationships separately via hierarchy map
- Easier to query and update individual blocks
- Moving blocks between parents is simpler

**Option B: Nested Storage (True BlockTree Pattern)**
- Store only top-level blocks: `blocks: BlockTree[]`
- Nested blocks stored in `BlockNode.children` by slot name
- More aligned with API structure
- Moving blocks requires tree manipulation

**Which approach do you prefer?** I recommend **Option A** for flexibility and alignment with the deletion requirement in Task 2.

#### Q2: Layout Metadata Storage

Currently `PlaygroundBlock` stores layout as `{ x, y, w, h }`. But this information is also in:
- GridStack DOM (the actual rendered positions)
- `BlockRenderStructure.layoutGrid.items` (the schema definition)

**Where should runtime layout positions be stored?**
- Option A: In memory only, derive from GridStack on demand
- Option B: Stored in BlockEnvironmentProvider state alongside blocks
- Option C: Stored within BlockTree.root.block.payload.meta

**My recommendation:** Option B - Store layout metadata in provider state for quick access, sync bidirectionally with GridStack.

#### Q3: Block Metadata (title, description, badge)

Current playground tracks:
- `title: string`
- `description?: string`
- `badge?: string`

These are UI-level metadata, not in `BlockTree.root.block`. Where should these live?

**Options:**
- A: In `Block.name` for title, ignore description/badge (simplest)
- B: Create `EditorBlockMetadata` interface to wrap `BlockTree` with UI data
- C: Store in `BlockTree.root.block.payload.meta.computedFields`

**My recommendation:** Option B - Create `EditorBlockInstance` type that wraps `BlockTree` with editor-specific metadata.

### Proposed Solution

#### New Type Definitions

```typescript
// context/block-environment-provider.tsx

/**
 * Editor-specific wrapper for BlockTree with UI metadata
 */
interface EditorBlockInstance {
    tree: BlockTree;                    // The actual block data
    layout: EditorLayoutRect;           // GridStack position
    uiMetadata?: EditorBlockUIMetadata; // Optional UI state
}

interface EditorLayoutRect {
    x: number;  // Grid column position
    y: number;  // Grid row position
    w: number;  // Width in columns
    h: number;  // Height in rows
}

interface EditorBlockUIMetadata {
    title?: string;         // Display title (overrides Block.name)
    description?: string;   // Description text
    badge?: string;         // Badge label
    collapsed?: boolean;    // Collapsed state
    locked?: boolean;       // Prevent editing
}

/**
 * Tracks hierarchical relationships between blocks
 */
interface EditorHierarchy {
    parentMap: Map<string, string | null>; // blockId -> parentId
}

/**
 * Complete editor environment
 */
interface EditorEnvironment {
    blocks: EditorBlockInstance[];      // All blocks (top-level + nested)
    hierarchy: EditorHierarchy;         // Parent-child relationships
    metadata: EditorEnvironmentMetadata;
}

interface EditorEnvironmentMetadata {
    name: string;
    description?: string;
    organisationId: string;
    createdAt: string;
    updatedAt: string;
}
```

#### Context API Design

```typescript
interface BlockEnvironmentContextValue {
    // State
    environment: EditorEnvironment;

    // Block operations
    addBlock(tree: BlockTree, layout?: EditorLayoutRect): string;
    removeBlock(blockId: string): void;
    updateBlock(blockId: string, tree: BlockTree): void;
    updateLayout(blockId: string, layout: EditorLayoutRect): void;
    getBlock(blockId: string): EditorBlockInstance | undefined;
    getAllBlocks(): EditorBlockInstance[];

    // Nesting operations
    insertNestedBlock(parentId: string, slotName: string, childTree: BlockTree): void;
    promoteToTopLevel(blockId: string): void; // Move nested block to top-level

    // Hierarchy queries
    getParent(blockId: string): string | null;
    getChildren(blockId: string, slotName?: string): string[];
    getDescendants(blockId: string): string[];
    isDescendantOf(blockId: string, ancestorId: string): boolean;

    // UI metadata
    updateUIMetadata(blockId: string, metadata: Partial<EditorBlockUIMetadata>): void;

    // Utilities
    createBlock(options: CreateBlockOptions): BlockTree;
    duplicateBlock(blockId: string): void;
    exportToServer(): ServerEnvironmentPayload;
    clear(): void;
}
```

### Implementation Steps

#### Phase 1: Create Core Provider (4-6 hours)

**File:** `context/block-environment-provider.tsx`

1. **Define types** (as shown above)
2. **Create context and provider component**
   ```typescript
   const BlockEnvironmentContext = createContext<BlockEnvironmentContextValue | null>(null);

   export const BlockEnvironmentProvider: FC<{
       initialEnvironment?: EditorEnvironment;
       organisationId: string;
       children: ReactNode;
   }> = ({ initialEnvironment, organisationId, children }) => {
       // State management
       const [environment, setEnvironment] = useState<EditorEnvironment>(
           initialEnvironment ?? createEmptyEnvironment(organisationId)
       );

       // Implement all context methods...
   };
   ```

3. **Implement block CRUD operations**
   - `addBlock`: Generate ID, add to blocks array, update hierarchy
   - `removeBlock`: Remove block + descendants, update hierarchy
   - `updateBlock`: Replace tree at ID
   - `updateLayout`: Update layout rect for block

4. **Implement hierarchy tracking**
   - `getParent`: O(1) lookup from parentMap
   - `getChildren`: Filter blocks where parent = blockId
   - `getDescendants`: Recursive traversal via getChildren
   - `isDescendantOf`: Check if blockId is in descendants of ancestorId

5. **Implement nesting operations**
   - `insertNestedBlock`: Add child to parent's BlockTree.root.children[slot], update hierarchy
   - `promoteToTopLevel`: Remove from parent slot, set parent to null, adjust layout

6. **Add layout synchronization**
   - Listen to GridStack events (change, dragstop, resizestop)
   - Update layout rects in environment
   - Handle block movement between parents (GridStack's nested grid events)

#### Phase 2: Integrate with GridStack (2-3 hours)

**File:** Create `hooks/use-environment-grid-sync.tsx`

```typescript
export const useEnvironmentGridSync = (
    parentId: string | null
) => {
    const { environment, updateLayout, getChildren, promoteToTopLevel } = useBlockEnvironment();
    const { gridStack } = useGrid();

    useEffect(() => {
        if (!gridStack) return;

        const handleLayoutChange = () => {
            const nodes = gridStack.engine.nodes ?? [];
            nodes.forEach(node => {
                updateLayout(String(node.id), {
                    x: node.x ?? 0,
                    y: node.y ?? 0,
                    w: node.w ?? 1,
                    h: node.h ?? 1
                });
            });
        };

        const handleBlockMoved = (event, items) => {
            // Detect if block moved out of parent
            items.forEach(item => {
                const blockId = String(item.id);
                const currentParent = getParent(blockId);

                // If moved out of nested grid to top-level
                if (currentParent && !item.grid._isNested) {
                    promoteToTopLevel(blockId);
                }
            });
        };

        gridStack.on('change', handleLayoutChange);
        gridStack.on('dropped', handleBlockMoved);

        return () => {
            gridStack.off('change');
            gridStack.off('dropped');
        };
    }, [gridStack, parentId]);
};
```

#### Phase 3: Create Block Renderer (2-3 hours)

**File:** Update `components/panel/panel.tsx`

Replace `PLAYGROUND_PANEL` and `PLAYGROUND_BLOCK` with unified `EDITOR_PANEL`:

```typescript
const EditorPanelWidget: React.FC<{ blockId: string }> = ({ blockId }) => {
    const { getBlock, removeBlock, insertNestedBlock, updateUIMetadata } = useBlockEnvironment();
    const { removeWidget } = useGrid();

    const blockInstance = getBlock(blockId);
    if (!blockInstance) return null;

    const { tree, layout, uiMetadata } = blockInstance;

    // Determine if block can nest
    const canNest = Boolean(tree.root.block.type.nesting);

    // Get nested children
    const children = canNest ? getChildren(blockId) : [];

    const handleDelete = () => {
        removeWidget(blockId);
        removeBlock(blockId);
    };

    const handleInsertNested = (item: SlashMenuItem) => {
        const newTree = createBlockFromSlashItem(item);
        insertNestedBlock(blockId, "main", newTree);
    };

    return (
        <PanelWrapper
            id={blockId}
            title={uiMetadata?.title ?? tree.root.block.name ?? "Untitled"}
            description={uiMetadata?.description}
            badge={uiMetadata?.badge}
            allowInsert={canNest}
            onInsert={canNest ? handleInsertNested : undefined}
            onDelete={handleDelete}
            onTitleChange={(title) => updateUIMetadata(blockId, { title })}
            nested={children.length > 0 ? (
                <NestedBlocksRenderer blockIds={children} />
            ) : null}
        >
            <RenderBlock tree={tree} display={tree.root.block.type.display.render} />
        </PanelWrapper>
    );
};

export const editorPanelRegistry = {
    EDITOR_PANEL: createRenderElement({
        type: "EDITOR_PANEL",
        name: "Block Panel",
        description: "Editable block with optional nesting",
        category: "BLOCK",
        schema: z.object({ blockId: z.string() }),
        component: EditorPanelWidget,
    }),
};
```

#### Phase 4: Remove Playground Code (1 hour)

1. **Delete files:**
   - Remove `PlaygroundContext`, `PlaygroundProvider` from `block-demo.tsx`
   - Remove `PlaygroundBlock` type
   - Remove all factory functions (keep as utilities for demo data generation)

2. **Update demo:**
   ```typescript
   // block-demo.tsx
   export const BlockDemo = () => {
       const orgId = "demo-org-id";

       return (
           <BlockEnvironmentProvider
               organisationId={orgId}
               initialEnvironment={createDemoEnvironment(orgId)}
           >
               <div className="mx-auto max-w-6xl space-y-8 p-6">
                   <header>
                       <h1>Block Environment Demo</h1>
                   </header>

                   <BlockEnvironmentWorkspace />

                   <AddBlockButton />
               </div>
           </BlockEnvironmentProvider>
       );
   };
   ```

#### Phase 5: Testing & Validation (2-3 hours)

1. **Test block operations:**
   - Add top-level block 
   - Add nested block 
   - Delete block 
   - Duplicate block 
   - Move block (drag/drop) 

2. **Test hierarchy tracking:**
   - Verify parent-child relationships 
   - Test getDescendants correctness 
   - Validate promotion to top-level 

3. **Test layout synchronization:**
   - GridStack � Provider updates 
   - Provider � GridStack updates 
   - Bidirectional consistency 

### Deliverables

**New Files:**
- `context/block-environment-provider.tsx` (~400 lines)
- `hooks/use-environment-grid-sync.tsx` (~150 lines)
- `util/block-environment.helpers.ts` (~200 lines)

**Modified Files:**
- `components/panel/panel.tsx` (rewrite, ~150 lines)
- `components/demo/block-demo.tsx` (simplify, remove ~900 lines)

**Deleted:**
- `PlaygroundContext` code
- `PlaygroundBlock` type
- Mock factory functions (move to separate demo utilities)

### Estimated Timeline

- **Phase 1:** 4-6 hours
- **Phase 2:** 2-3 hours
- **Phase 3:** 2-3 hours
- **Phase 4:** 1 hour
- **Phase 5:** 2-3 hours

**Total:** 11-16 hours

---

## Task 1.5: Child Block Movement & BlockTree Migration

### Requirements Analysis

**From Task 1.5 Description:**
> A block consists of a block type, the block payload itself, and then also holds the data of other blocks that are nested within that particular block. This might include a reference to an existing block. Or just an entire direct child block. With the current context. There needs to be functionality to ensure that if I alter the positioning of a child block (ie. Move it to the top level of an environment, or move it to an entirely different block) That data is then migrated and updated to its new position (ie. A new block tree is created where that child block is the root, or that block is moved to become a reference of the new nested block that it has been moved into)

**Current State:**
- Task 1 implemented `BlockEnvironmentProvider` with hierarchy tracking
- `promoteToTopLevel` function exists (line 382-449 in block-environment-provider.tsx)
- When a nested block is moved, hierarchy map is updated
- However, BlockTree structure may not be properly migrated

**The Problem:**
When a block is nested within a parent, it exists in two places:
1. **In the flat blocks array** as an `EditorBlockInstance`
2. **In the parent's BlockTree** as a `BlockNode` in `tree.root.children[slotName]`

When moving a block between parents or promoting to top-level, we need to ensure:
- The block is removed from the old parent's `BlockTree.root.children`
- The block is added to the new parent's `BlockTree.root.children` (if applicable)
- A new BlockTree is created if the block becomes top-level
- References are preserved/updated correctly
- The hierarchy map is updated

**Current Implementation Gap:**
The existing `promoteToTopLevel` function (line 382-449) does:
- ✅ Find block in blocks array
- ✅ Remove from parent's BlockTree
- ✅ Update layout
- ✅ Update hierarchy map to null

But it does NOT:
- ❌ Create a new BlockTree with the promoted block as root
- ❌ Handle moving blocks between different parents (only handles promotion to top-level)
- ❌ Properly handle references when moving blocks

**Requirements:**
1. **Promotion (nested → top-level)**: Create new BlockTree with promoted block as root
2. **Relocation (parent A → parent B)**: Move block from one parent's children to another's
3. **Reference handling**: Preserve or update block references appropriately
4. **Data integrity**: Ensure all BlockTree structures remain valid after migration
5. **Cascade updates**: If moving a block with descendants, migrate all descendants

### Questions for Clarification

Before implementing, I need clarification on the following:

#### Q1: BlockTree Creation on Promotion

When a nested block is promoted to top-level, should we:

**Option A: Create New BlockTree**
- Generate a completely new BlockTree with the promoted block as `root`
- Give it a new ID (breaking the original reference)
- This makes it a "new" block from the API's perspective

**Option B: Preserve BlockTree**
- Keep the existing BlockTree reference
- Simply remove it from parent's children and add to top-level
- Maintain the same block ID
- This preserves the block identity

**Which approach aligns with your API expectations?** I recommend **Option B** to preserve block identity and references.

#### Q2: References vs Direct Children

The task mentions "This might include a reference to an existing block. Or just an entire direct child block."

In BlockTree structure:
- **Direct children**: Stored in `BlockNode.children[slotName]` as full `BlockNode` objects
- **References**: Stored in `BlockNode.references` as separate block trees

When moving a block:
- If it's a **direct child** → should be removed from parent's children and migrated
- If it's a **reference** → should we break the reference? Or keep it?

**Question:** When moving a block that is referenced by its parent (not a direct child), should we:
- **Option A**: Break the reference relationship (remove from parent.references)
- **Option B**: Keep the reference intact (block exists in two places)
- **Option C**: Convert reference to direct child in new location

#### Q3: Nested Block Migration

When moving a block with its own nested children:

**Scenario:** Block A has child Block B. User moves Block A from Parent C to top-level.

Should we:
- **Option A**: Move only Block A, leave Block B under Parent C
- **Option B**: Move Block A with all its descendants (Block B comes too)

**Recommendation:** Option B - maintain parent-child relationships, move entire subtree together.

#### Q4: Slot Assignment

When moving a block to a new parent, which slot should it be added to?

**Options:**
- **Option A**: User specifies slot in UI (dropdown/menu)
- **Option B**: Always use "main" slot by default
- **Option C**: Use the same slot name it had in previous parent
- **Option D**: Parent BlockType defines "default slot" in nesting config

**Recommendation:** Option B for simplicity, but expose slot parameter in API for future flexibility.

### Proposed Solution

#### Architecture Overview

```
Block Movement Flow:

1. User drags Block B from Parent A to Parent C
        ↓
2. GridStack fires "dropped" event
        ↓
3. useEnvironmentGridSync detects parent change
        ↓
4. Calls moveBlock(blockId, newParentId, newLayout)
        ↓
5. BlockEnvironmentProvider:
   a. Remove from old parent's BlockTree.children
   b. Add to new parent's BlockTree.children
   c. Update hierarchy map
   d. If newParentId === null: handle promotion logic
        ↓
6. Re-render affected components
```

#### New Type Definitions

```typescript
/**
 * Options for moving a block between parents
 */
interface MoveBlockOptions {
    blockId: string;
    targetParentId: string | null;  // null = top-level
    targetSlot?: string;             // Which slot in target parent
    layout?: EditorLayoutRect;       // New layout position
    preserveReferences?: boolean;    // Keep reference links intact
}
```

#### Updated Context API

```typescript
interface BlockEnvironmentContextValue {
    // ... existing methods ...

    // Enhanced movement operations
    moveBlock(options: MoveBlockOptions): void;
    promoteToTopLevel(blockId: string, layout?: EditorLayoutRect): void; // Enhanced
    demoteToNested(blockId: string, parentId: string, slotName: string): void; // New

    // BlockTree manipulation
    extractSubtree(blockId: string): BlockTree; // Extract block as new root
    mergeSubtree(parentId: string, slotName: string, subtree: BlockTree): void; // Merge into parent
}
```

### Implementation Steps

#### Phase 1: Enhanced promoteToTopLevel (2-3 hours)

**File:** `context/block-environment-provider.tsx`

Update `promoteToTopLevel` to properly create a new BlockTree structure:

```typescript
const promoteToTopLevel = useCallback((blockId: string, layout?: EditorLayoutRect): void => {
    setEnvironment((prev) => {
        const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
        if (!blockInstance) {
            console.warn(`Block ${blockId} not found`);
            return prev;
        }

        const currentParent = prev.hierarchy.parentMap.get(blockId);
        if (!currentParent) {
            console.warn(`Block ${blockId} is already top-level`);
            return prev;
        }

        // Remove from parent's BlockTree
        const parentInstance = prev.blocks.find((b) => b.tree.root.block.id === currentParent);
        let updatedBlocks = [...prev.blocks];

        if (parentInstance) {
            const updatedParentTree = removeChildFromBlockTree(parentInstance.tree, blockId);
            updatedBlocks = updatedBlocks.map((b) =>
                b.tree.root.block.id === currentParent ? { ...b, tree: updatedParentTree } : b
            );
        }

        // Extract the child as a complete BlockTree (NEW STEP)
        const extractedTree = extractBlockAsTree(blockInstance.tree, blockId);

        // Update block's tree and layout
        updatedBlocks = updatedBlocks.map((b) => {
            if (b.tree.root.block.id === blockId) {
                return {
                    ...b,
                    tree: extractedTree,
                    layout: layout ?? b.layout
                };
            }
            return b;
        });

        // Update hierarchy to null (top-level)
        const updatedParentMap = new Map(prev.hierarchy.parentMap);
        updatedParentMap.set(blockId, null);

        // Also update hierarchy for all descendants to maintain correct paths
        const descendants = getDescendantsImpl(blockId, prev.hierarchy.parentMap);
        // Descendants' parent relationships remain the same, they're just now under a top-level block

        return {
            ...prev,
            blocks: updatedBlocks,
            hierarchy: {
                parentMap: updatedParentMap,
            },
            metadata: {
                ...prev.metadata,
                updatedAt: new Date().toISOString(),
            },
        };
    });
}, []);
```

#### Phase 2: New moveBlock Function (3-4 hours)

**File:** `context/block-environment-provider.tsx`

Implement general-purpose block movement:

```typescript
const moveBlock = useCallback((options: MoveBlockOptions): void => {
    const { blockId, targetParentId, targetSlot = "main", layout, preserveReferences = false } = options;

    setEnvironment((prev) => {
        const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
        if (!blockInstance) {
            console.warn(`Block ${blockId} not found`);
            return prev;
        }

        const currentParentId = prev.hierarchy.parentMap.get(blockId);

        // Case 1: Moving to top-level (promotion)
        if (targetParentId === null) {
            // Delegate to promoteToTopLevel
            promoteToTopLevel(blockId, layout);
            return prev; // promoteToTopLevel will handle state update
        }

        // Case 2: Moving from top-level to nested (demotion)
        if (currentParentId === null && targetParentId !== null) {
            return handleDemotion(prev, blockId, targetParentId, targetSlot, layout);
        }

        // Case 3: Moving between different parents
        if (currentParentId !== targetParentId) {
            return handleRelocation(prev, blockId, currentParentId, targetParentId, targetSlot, layout);
        }

        // Case 4: Same parent, just layout change
        return handleLayoutChange(prev, blockId, layout);
    });
}, [promoteToTopLevel]);
```

#### Phase 3: Helper Functions (2-3 hours)

**File:** `context/block-environment-provider.tsx`

Implement helper functions for block tree manipulation:

```typescript
/**
 * Extracts a child block as a new root-level BlockTree
 */
function extractBlockAsTree(parentTree: BlockTree, childId: string): BlockTree {
    // Find child in parent's children slots
    for (const [slotName, nodes] of Object.entries(parentTree.root.children)) {
        const childNode = nodes.find((node) => node.block.id === childId);

        if (childNode) {
            // Create new BlockTree with child as root
            return {
                maxDepth: parentTree.maxDepth,
                expandRefs: parentTree.expandRefs,
                root: childNode,
            };
        }
    }

    // If not found in children, check references
    const childRef = parentTree.root.references?.[childId];
    if (childRef) {
        return childRef; // Reference is already a BlockTree
    }

    throw new Error(`Child ${childId} not found in parent tree`);
}

/**
 * Handles moving a block from top-level to nested (demotion)
 */
function handleDemotion(
    prev: EditorEnvironment,
    blockId: string,
    targetParentId: string,
    targetSlot: string,
    layout?: EditorLayoutRect
): EditorEnvironment {
    const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
    const targetParent = prev.blocks.find((b) => b.tree.root.block.id === targetParentId);

    if (!blockInstance || !targetParent) return prev;

    // Check if target parent allows nesting
    if (!targetParent.tree.root.block.type.nesting) {
        console.warn(`Target parent ${targetParentId} does not allow nesting`);
        return prev;
    }

    // Add block to target parent's children
    const updatedTargetTree = addChildToBlockTree(
        targetParent.tree,
        targetSlot,
        blockInstance.tree.root
    );

    // Update blocks array
    let updatedBlocks = prev.blocks.map((b) =>
        b.tree.root.block.id === targetParentId
            ? { ...b, tree: updatedTargetTree }
            : b
    );

    // Update layout if provided
    if (layout) {
        updatedBlocks = updatedBlocks.map((b) =>
            b.tree.root.block.id === blockId ? { ...b, layout } : b
        );
    }

    // Update hierarchy
    const updatedParentMap = new Map(prev.hierarchy.parentMap);
    updatedParentMap.set(blockId, targetParentId);

    return {
        ...prev,
        blocks: updatedBlocks,
        hierarchy: { parentMap: updatedParentMap },
        metadata: {
            ...prev.metadata,
            updatedAt: new Date().toISOString(),
        },
    };
}

/**
 * Handles moving a block between two different parents
 */
function handleRelocation(
    prev: EditorEnvironment,
    blockId: string,
    currentParentId: string | null,
    targetParentId: string,
    targetSlot: string,
    layout?: EditorLayoutRect
): EditorEnvironment {
    const blockInstance = prev.blocks.find((b) => b.tree.root.block.id === blockId);
    const targetParent = prev.blocks.find((b) => b.tree.root.block.id === targetParentId);

    if (!blockInstance || !targetParent) return prev;

    let updatedBlocks = [...prev.blocks];

    // Remove from current parent
    if (currentParentId) {
        const currentParent = prev.blocks.find((b) => b.tree.root.block.id === currentParentId);
        if (currentParent) {
            const updatedCurrentTree = removeChildFromBlockTree(currentParent.tree, blockId);
            updatedBlocks = updatedBlocks.map((b) =>
                b.tree.root.block.id === currentParentId
                    ? { ...b, tree: updatedCurrentTree }
                    : b
            );
        }
    }

    // Add to target parent
    const updatedTargetTree = addChildToBlockTree(
        targetParent.tree,
        targetSlot,
        blockInstance.tree.root
    );

    updatedBlocks = updatedBlocks.map((b) =>
        b.tree.root.block.id === targetParentId
            ? { ...b, tree: updatedTargetTree }
            : b
    );

    // Update layout if provided
    if (layout) {
        updatedBlocks = updatedBlocks.map((b) =>
            b.tree.root.block.id === blockId ? { ...b, layout } : b
        );
    }

    // Update hierarchy
    const updatedParentMap = new Map(prev.hierarchy.parentMap);
    updatedParentMap.set(blockId, targetParentId);

    return {
        ...prev,
        blocks: updatedBlocks,
        hierarchy: { parentMap: updatedParentMap },
        metadata: {
            ...prev.metadata,
            updatedAt: new Date().toISOString(),
        },
    };
}

/**
 * Handles simple layout change without parent change
 */
function handleLayoutChange(
    prev: EditorEnvironment,
    blockId: string,
    layout?: EditorLayoutRect
): EditorEnvironment {
    if (!layout) return prev;

    const updatedBlocks = prev.blocks.map((b) =>
        b.tree.root.block.id === blockId ? { ...b, layout } : b
    );

    return {
        ...prev,
        blocks: updatedBlocks,
    };
}
```

#### Phase 4: Update GridStack Sync (2 hours)

**File:** `hooks/use-environment-grid-sync.tsx`

Update to use new `moveBlock` function:

```typescript
const handleBlockMoved = (event: Event, prevWidget: any, newWidget: any) => {
    if (!newWidget) return;

    const blockId = String(newWidget.id);
    const currentParent = getParent(blockId);

    // Determine the new parent based on the grid
    const newParent = parentId; // parentId from hook parameter

    // Check if parent changed
    if (currentParent !== newParent) {
        moveBlock({
            blockId,
            targetParentId: newParent,
            targetSlot: "main",
            layout: {
                x: newWidget.x ?? 0,
                y: newWidget.y ?? 0,
                w: newWidget.w ?? 1,
                h: newWidget.h ?? 1,
            },
        });
    }
};
```

#### Phase 5: Testing (3-4 hours)

Test scenarios:
1. **Promote nested block to top-level**
   - Verify BlockTree created with block as root
   - Verify removed from parent's children
   - Verify hierarchy updated

2. **Demote top-level block to nested**
   - Verify added to parent's children
   - Verify hierarchy updated

3. **Move block between different parents**
   - Verify removed from parent A
   - Verify added to parent B
   - Verify hierarchy updated

4. **Move block with descendants**
   - Verify entire subtree moves together
   - Verify descendant relationships preserved

5. **Reference handling**
   - Test what happens with block references

### Deliverables

**Modified Files:**
- `context/block-environment-provider.tsx` (~800 lines total)
  - Enhanced `promoteToTopLevel` function
  - New `moveBlock` function
  - New helper functions: `extractBlockAsTree`, `handleDemotion`, `handleRelocation`, `handleLayoutChange`

- `hooks/use-environment-grid-sync.tsx` (~120 lines)
  - Updated event handlers to use `moveBlock`

**New Types:**
- `MoveBlockOptions` interface

### Estimated Timeline

- **Phase 1:** 2-3 hours (enhance promoteToTopLevel)
- **Phase 2:** 3-4 hours (implement moveBlock)
- **Phase 3:** 2-3 hours (helper functions)
- **Phase 4:** 2 hours (GridStack integration)
- **Phase 5:** 3-4 hours (testing)

**Total:** 12-16 hours

### Dependencies

- ✅ Task 1 complete (BlockEnvironmentProvider exists)
- Blocks after Task 1.5 completion: Task 2, Task 3

---

## Task 2: Smart Block Deletion

### Requirements Analysis

**Current Problem:**
When a nested block is moved outside of its parent (via drag/drop in GridStack), and the parent is then deleted, the moved block is also deleted. This indicates the deletion logic uses the original hierarchy stored in `BlockTree.root.children`, not the real-time layout structure.

**Root Cause:**
The current `removeBlockById` function (lines 1119-1127 in block-demo.tsx) recursively deletes based on the `children` array, which is not updated when blocks are moved in GridStack.

```typescript
function removeBlockById(blocks: PlaygroundBlock[], targetId: string): PlaygroundBlock[] {
    return blocks
        .filter((block) => block.id !== targetId)
        .map((block) =>
            block.children
                ? { ...block, children: removeBlockById(block.children, targetId) }
                : block
        );
}
```

**Requirements:**
1.  Deletion must use real-time layout hierarchy (not BlockTree.children)
2.  Only delete blocks that are currently nested (according to GridStack)
3.  Blocks moved out before deletion should survive
4.  Support cascading delete of current descendants

### Proposed Solution

With `BlockEnvironmentProvider` from Task 1, the hierarchy is tracked in real-time via the `EditorHierarchy` structure. The deletion logic can use this.

#### Implementation Strategy

**File:** `context/block-environment-provider.tsx`

Update the `removeBlock` method:

```typescript
const removeBlock = useCallback((blockId: string): void => {
    setEnvironment(prev => {
        // 1. Get current descendants from real-time hierarchy
        const descendantsToDelete = getDescendants(blockId);
        const allToDelete = [blockId, ...descendantsToDelete];

        // 2. Remove from blocks array
        const updatedBlocks = prev.blocks.filter(
            b => !allToDelete.includes(b.tree.root.block.id)
        );

        // 3. Update hierarchy (remove entries)
        const updatedParentMap = new Map(prev.hierarchy.parentMap);
        allToDelete.forEach(id => updatedParentMap.delete(id));

        // 4. If block had a parent, update parent's BlockTree.children
        const parentId = prev.hierarchy.parentMap.get(blockId);
        if (parentId) {
            const parentInstance = prev.blocks.find(
                b => b.tree.root.block.id === parentId
            );

            if (parentInstance) {
                // Remove from parent's BlockTree slot
                const updatedParentTree = removeChildFromBlockTree(
                    parentInstance.tree,
                    blockId
                );

                // Update parent in blocks array
                const blockIndex = updatedBlocks.findIndex(
                    b => b.tree.root.block.id === parentId
                );
                if (blockIndex >= 0) {
                    updatedBlocks[blockIndex] = {
                        ...updatedBlocks[blockIndex],
                        tree: updatedParentTree
                    };
                }
            }
        }

        return {
            ...prev,
            blocks: updatedBlocks,
            hierarchy: {
                parentMap: updatedParentMap
            },
            metadata: {
                ...prev.metadata,
                updatedAt: new Date().toISOString()
            }
        };
    });
}, [getDescendants]);
```

#### Helper Function

```typescript
/**
 * Removes a child block from all slots in a BlockTree
 */
function removeChildFromBlockTree(tree: BlockTree, childId: string): BlockTree {
    const updatedChildren: Record<string, BlockNode[]> = {};

    for (const [slotName, nodes] of Object.entries(tree.root.children)) {
        updatedChildren[slotName] = nodes.filter(
            node => node.block.id !== childId
        );
    }

    return {
        ...tree,
        root: {
            ...tree.root,
            children: updatedChildren
        }
    };
}
```

#### GridStack Integration

**File:** `hooks/use-environment-grid-sync.tsx`

Add hierarchy tracking on GridStack events:

```typescript
const handleBlockMoved = (event: Event, items: GridStackNode[]) => {
    items.forEach(item => {
        const blockId = String(item.id);
        const previousParent = getParent(blockId);

        // Determine new parent based on grid
        const newParent = item.grid._isNested
            ? item.grid._parentId
            : null;

        // Update hierarchy if changed
        if (previousParent !== newParent) {
            updateHierarchy(blockId, newParent);
        }
    });
};

gridStack.on('dropped', handleBlockMoved);
gridStack.on('added', handleBlockMoved);
gridStack.on('removed', (event, items) => {
    // Block removed from grid, check if it was moved elsewhere
    items.forEach(item => {
        const blockId = String(item.id);
        // If not found in any grid, it was deleted
        if (!findBlockInAnyGrid(blockId)) {
            removeBlock(blockId);
        }
    });
});
```

### Implementation Steps

#### Step 1: Add Hierarchy Tracking (2 hours)

1. Add `updateHierarchy` method to `BlockEnvironmentProvider`
2. Implement `getDescendants` using real-time hierarchy
3. Add hierarchy update on block move events

#### Step 2: Update Deletion Logic (2 hours)

1. Modify `removeBlock` to use `getDescendants`
2. Add `removeChildFromBlockTree` helper
3. Update parent BlockTree when child deleted

#### Step 3: GridStack Event Handlers (2 hours)

1. Add `dropped` event handler
2. Add `added` event handler (for block moving into nested grid)
3. Add `removed` event handler (for cleanup)
4. Test move-then-delete scenarios

#### Step 4: Testing (2 hours)

Test scenarios:
1. Delete top-level block (should remove descendants) 
2. Move nested block out, delete parent (moved block survives) 
3. Move nested block to different parent, delete original parent (block survives) 
4. Nested block with children, move out, delete original parent (all survive) 

### Deliverables

**Modified Files:**
- `context/block-environment-provider.tsx` (add hierarchy tracking)
- `hooks/use-environment-grid-sync.tsx` (add event handlers)
- `util/block-tree.helpers.ts` (add removeChildFromBlockTree)

### Estimated Timeline

**Total:** 8 hours

---

## Task 3: Data Form Mode

### Requirements Analysis

**Current State:**
- All blocks use pre-filled demo data
- `BlockType.display.form: BlockFormStructure` defines form schema
- `panel-wrapper.tsx` has mode toggle (display/form) but form is not implemented
- `panel-block-form.tsx` exists but is a placeholder

**Requirements:**
1.  Allow users to edit block data inline via form mode
2.  Use `BlockFormStructure` to generate form fields
3.  Persist data changes to `BlockTree.root.block.payload.data`
4.  Validate form input before saving
5.  Support all form widget types from OpenAPI schema

### BlockFormStructure Schema

From `lib/types/types.ts` (lines 1025-1033):

```typescript
FormWidgetConfig {
    type: "TEXT_INPUT" | "NUMBER_INPUT" | "CHECKBOX" | "RADIO_BUTTON"
        | "DROPDOWN" | "DATE_PICKER" | "EMAIL_INPUT" | "PHONE_INPUT"
        | "CURRENCY_INPUT" | "TEXT_AREA" | "FILE_UPLOAD" | "SLIDER"
        | "TOGGLE_SWITCH";
    label: string;
    description?: string;
    tooltip?: string;
    placeholder?: string;
    options?: Option[];
}

BlockFormStructure {
    fields: Record<string, FormWidgetConfig>;
}
```

### Proposed Solution

#### Architecture

```
PanelWrapper (mode: "form")
    �
BlockFormRenderer
    �
FormFieldRegistry (map widget type � component)
    �
Individual field components (TextInput, DatePicker, etc.)
    �
Form state management (react-hook-form)
    �
Validation (Zod from BlockSchema)
    �
Save to BlockEnvironmentProvider.updateBlock()
```

#### Form State Management

Use **react-hook-form** with Zod validation:

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: blockData,
    resolver: zodResolver(generateSchemaFromBlockSchema(blockType.schema))
});
```

### Implementation Steps

#### Phase 1: Form Widget Components (6-8 hours)

**File:** `components/panel/form-widgets/`

Create form widget components:

```typescript
// form-widgets/text-input.tsx
interface TextInputProps {
    name: string;
    label: string;
    description?: string;
    placeholder?: string;
    required?: boolean;
    register: UseFormRegister<any>;
    error?: FieldError;
}

export const TextInputWidget: FC<TextInputProps> = ({
    name, label, description, placeholder, required, register, error
}) => {
    return (
        <div className="space-y-2">
            <Label htmlFor={name}>
                {label}
                {required && <span className="text-destructive">*</span>}
            </Label>
            {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
            )}
            <Input
                id={name}
                placeholder={placeholder}
                {...register(name)}
                className={error ? "border-destructive" : ""}
            />
            {error && (
                <p className="text-sm text-destructive">{error.message}</p>
            )}
        </div>
    );
};
```

Implement all widget types:
1. `TextInputWidget` (text, email, phone)
2. `NumberInputWidget`
3. `TextAreaWidget`
4. `CheckboxWidget`
5. `RadioButtonWidget`
6. `DropdownWidget`
7. `DatePickerWidget`
8. `CurrencyInputWidget`
9. `FileUploadWidget`
10. `SliderWidget`
11. `ToggleSwitchWidget`

#### Phase 2: Form Field Registry (2 hours)

**File:** `components/panel/form-widgets/form-widget.registry.tsx`

```typescript
type FormWidgetType = FormWidgetConfig["type"];

interface FormWidgetRenderer {
    type: FormWidgetType;
    component: ComponentType<FormWidgetProps>;
}

const formWidgetRegistry: Record<FormWidgetType, FormWidgetRenderer> = {
    TEXT_INPUT: { type: "TEXT_INPUT", component: TextInputWidget },
    EMAIL_INPUT: { type: "EMAIL_INPUT", component: TextInputWidget },
    NUMBER_INPUT: { type: "NUMBER_INPUT", component: NumberInputWidget },
    // ... all types
};

export const getFormWidget = (type: FormWidgetType) => {
    return formWidgetRegistry[type] || formWidgetRegistry.TEXT_INPUT;
};
```

#### Phase 3: Block Form Renderer (4-5 hours)

**File:** `components/panel/panel-block-form.tsx`

```typescript
interface BlockFormProps {
    blockId: string;
    tree: BlockTree;
    formStructure: BlockFormStructure;
    onSave: (updatedTree: BlockTree) => void;
    onCancel: () => void;
}

export const BlockForm: FC<BlockFormProps> = ({
    blockId, tree, formStructure, onSave, onCancel
}) => {
    // Extract initial data from tree.root.block.payload.data
    const initialData = tree.root.block.payload.data;

    // Generate Zod schema from BlockSchema
    const validationSchema = useMemo(
        () => generateZodSchema(tree.root.block.type.schema),
        [tree.root.block.type.schema]
    );

    // Setup form
    const form = useForm({
        defaultValues: initialData,
        resolver: zodResolver(validationSchema)
    });

    const onSubmit = (data: any) => {
        // Create updated BlockTree
        const updatedTree: BlockTree = {
            ...tree,
            root: {
                ...tree.root,
                block: {
                    ...tree.root.block,
                    payload: {
                        ...tree.root.block.payload,
                        data: data
                    }
                }
            }
        };

        onSave(updatedTree);
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {Object.entries(formStructure.fields).map(([fieldName, config]) => {
                const Widget = getFormWidget(config.type);
                return (
                    <Widget.component
                        key={fieldName}
                        name={fieldName}
                        label={config.label}
                        description={config.description}
                        placeholder={config.placeholder}
                        options={config.options}
                        register={form.register}
                        error={form.formState.errors[fieldName]}
                    />
                );
            })}

            <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">
                    Save changes
                </Button>
            </div>
        </form>
    );
};
```

#### Phase 4: Zod Schema Generator (3-4 hours)

**File:** `util/block-schema-to-zod.ts`

```typescript
/**
 * Converts BlockSchema (OpenAPI) to Zod schema for validation
 */
export function generateZodSchema(schema: BlockSchema): z.ZodTypeAny {
    switch (schema.type) {
        case "STRING":
            let stringSchema = z.string();

            // Apply format validators
            if (schema.format === "EMAIL") {
                stringSchema = stringSchema.email();
            } else if (schema.format === "URL") {
                stringSchema = stringSchema.url();
            } else if (schema.format === "PHONE") {
                stringSchema = stringSchema.regex(/^\+?[1-9]\d{1,14}$/);
            }

            return schema.required ? stringSchema : stringSchema.optional();

        case "NUMBER":
            const numberSchema = z.number();
            return schema.required ? numberSchema : numberSchema.optional();

        case "BOOLEAN":
            return z.boolean();

        case "OBJECT":
            if (!schema.properties) return z.object({});

            const shape: Record<string, z.ZodTypeAny> = {};
            for (const [key, propSchema] of Object.entries(schema.properties)) {
                shape[key] = generateZodSchema(propSchema);
            }
            return z.object(shape);

        case "ARRAY":
            if (!schema.items) return z.array(z.unknown());
            return z.array(generateZodSchema(schema.items));

        case "NULL":
            return z.null();

        default:
            return z.unknown();
    }
}
```

#### Phase 5: Integration with PanelWrapper (2 hours)

**File:** `components/panel/panel-wrapper.tsx`

Update to render form when mode === "form":

```typescript
const PanelWrapper: FC<Props> = ({ ... }) => {
    const { updateBlock } = useBlockEnvironment();
    const blockInstance = getBlock(id);

    const handleFormSave = (updatedTree: BlockTree) => {
        updateBlock(id, updatedTree);
        setMode("display");
    };

    const content = useMemo(() => {
        if (mode === "form" && blockInstance) {
            const formStructure = blockInstance.tree.root.block.type.display.form;

            if (!formStructure || Object.keys(formStructure.fields).length === 0) {
                return (
                    <div className="p-4 text-center text-muted-foreground">
                        No form fields defined for this block type
                    </div>
                );
            }

            return (
                <BlockForm
                    blockId={id}
                    tree={blockInstance.tree}
                    formStructure={formStructure}
                    onSave={handleFormSave}
                    onCancel={() => setMode("display")}
                />
            );
        }

        return display ?? children;
    }, [mode, blockInstance, display, children]);

    // ... rest of component
};
```

#### Phase 6: Demo Block Types with Forms (2 hours)

Update demo block factories to include `BlockFormStructure`:

```typescript
// Example: Contact block form
const contactFormStructure: BlockFormStructure = {
    fields: {
        "client.name": {
            type: "TEXT_INPUT",
            label: "Contact Name",
            placeholder: "Enter name",
            description: "Full name of the contact"
        },
        "client.contact.email": {
            type: "EMAIL_INPUT",
            label: "Email",
            placeholder: "name@example.com"
        },
        "client.contact.phone": {
            type: "PHONE_INPUT",
            label: "Phone",
            placeholder: "+1 (555) 000-0000"
        },
        "client.type": {
            type: "DROPDOWN",
            label: "Client Type",
            options: [
                { label: "Customer", value: "CUSTOMER" },
                { label: "Prospect", value: "PROSPECT" },
                { label: "Partner", value: "PARTNER" }
            ]
        }
    }
};
```

#### Phase 7: Testing (3-4 hours)

Test scenarios:
1. Toggle to form mode 
2. Edit text fields 
3. Validation errors display correctly 
4. Save updates BlockTree 
5. Cancel reverts changes 
6. All widget types render correctly 
7. Nested object paths work (e.g., "client.name") 

### Deliverables

**New Files:**
- `components/panel/form-widgets/*.tsx` (11 widget components, ~100 lines each)
- `components/panel/form-widgets/form-widget.registry.tsx` (~100 lines)
- `util/block-schema-to-zod.ts` (~150 lines)

**Modified Files:**
- `components/panel/panel-block-form.tsx` (implement, ~200 lines)
- `components/panel/panel-wrapper.tsx` (add form mode rendering)
- Demo factory functions (add form structures)

### Estimated Timeline

- **Phase 1:** 6-8 hours (form widget components)
- **Phase 2:** 2 hours (registry)
- **Phase 3:** 4-5 hours (form renderer)
- **Phase 4:** 3-4 hours (Zod generator)
- **Phase 5:** 2 hours (integration)
- **Phase 6:** 2 hours (demo forms)
- **Phase 7:** 3-4 hours (testing)

**Total:** 22-29 hours

---

## Overall Timeline Summary

| Task | Estimated Time | Dependencies |
|------|---------------|--------------|
| Task 1: BlockEnvironmentProvider | 11-16 hours | None |
| Task 2: Smart Block Deletion | 8 hours | Task 1 complete |
| Task 3: Data Form Mode | 22-29 hours | Task 1 complete |

**Total Project Time:** 41-53 hours (approximately 5-7 working days)

---

## Risk Assessment

### High Risk
- **GridStack nested grid events**: GridStack's event system for nested grids has known issues (documented in code comments). May require workarounds.
- **BlockTree mutation complexity**: Updating nested BlockTree structures immutably is complex. Need thorough testing.

### Medium Risk
- **Form validation edge cases**: Complex nested object schemas may not convert cleanly to Zod.
- **Layout synchronization race conditions**: Bidirectional sync between GridStack and provider state could have edge cases.

### Low Risk
- **Type safety**: All types come from OpenAPI, should be consistent.
- **Component reusability**: Form widgets follow standard patterns.

---

## Questions Requiring Answers Before Implementation

**Critical Questions:**

1. **Q1 (Task 1):** Should blocks be stored flat or nested? (Recommend: flat)
2. **Q2 (Task 1):** Where to store runtime layout positions? (Recommend: provider state)
3. **Q3 (Task 1):** Where to store UI metadata (title, description, badge)? (Recommend: EditorBlockInstance wrapper)

**Additional Questions:**

4. Should form changes auto-save or require explicit save action? (Current plan: explicit save with Save/Cancel buttons)
5. Should there be an "unsaved changes" warning when switching from form to display mode? (Recommend: yes)
6. For nested blocks, should the form mode cascade to show nested block forms? (Recommend: no, each block edits independently)
7. Should deleted blocks be soft-deleted (archived) or hard-deleted? (Recommend: hard delete for now, soft delete later)

**Please review and provide answers to these questions before I proceed with implementation.**

---

**Status:** � Awaiting approval and clarification on questions above.
