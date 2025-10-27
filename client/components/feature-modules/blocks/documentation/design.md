## Block Environment Architecture

This document explains how the block editor is wired together after the overhaul of the environment provider. It covers the data structures that back the editor, the functions that mutate them, and how those changes are rendered through GridStack and the React component hierarchy.

---

### 1. Top-Level Concepts

- **BlockTree (domain)** – Immutable representation of a block plus any nested children (taken from the OpenAPI types).
- **EditorTreeInstance** – One top-level tree in the editor. It holds:
  - `id`: the root block id (used as the tree’s identifier).
  - `tree`: the `BlockTree` for that root block.
  - `layout?`: optional persisted layout rectangle for the root.
- **Hierarchy Map** – `Map<blockId, parentBlockId | null>` describing parent → child relationships inside a tree. `null` indicates the block is a root of a top-level tree.
- **Tree Index** – `Map<blockId, rootId>` so any block can be traced back to the block tree that owns it.
- **Layouts Map** – `Map<blockId, EditorLayoutRect>` storing GridStack coordinates for every block (top-level + nested).
- **UI Metadata Map** – Editor-only flags (`collapsed`, `locked`, etc.).
- **Panel wrapper (UI-only)** – Panels are not block types. Every rendered block tree is wrapped in `PanelWrapper` to provide editor chrome (toolbar, focus, slash menu). The underlying block payload remains unchanged.

---

### 2. BlockEnvironmentProvider

The provider (`components/feature-modules/blocks/context/block-environment-provider.tsx`) is the source of truth for editor state. Important pieces:

- **State Initialisation**
  - `normaliseEnvironment(initialTrees, organisationId)` builds the maps from the supplied top-level `EditorTreeInstance[]`.
  - `createEmptyEnvironment` creates an empty skeleton with fresh maps/time stamps.

- **Materialising Block Instances**
  - `materialiseBlockInstance(environment, blockId)` rehydrates an `EditorBlockInstance` on demand (either the top-level tree or a virtual tree built from a nested `BlockNode`).

- **Mutation Helpers**
  - `detachNode(tree, blockId)`: Removes a block node from a tree, returning the updated tree and the detached node.
  - `insertNode(tree, parentId, slotName, node)`: Inserts a node into a tree under `parentId/slotName`.
  - `replaceNode(tree, blockId, replacement)`: Replaces a node in-place (used by `updateBlock`).
  - `calculateNextLayout(layouts, hierarchy, parentId)`: Provides a default GridStack rect based on siblings.
  - `collectTreeBlockIds` / `collectDescendantIds`: utilities for hierarchy and clean-up.

- **Public API (exposed via context)**
  - `addBlock(tree, layout?, parentId?)`: Creates a new top-level tree when `parentId` is null; otherwise delegates to `insertNestedBlockInternal`.
  - `removeBlock(blockId)`: Removes a top-level tree (and all descendants) or prunes a nested block from its parent tree.
  - `updateBlock(blockId, tree)`: Replaces the block node inside its owning tree (or swaps out the entire tree if it is the root).
  - `updateLayout(blockId, layout)`: Updates the layout map.
  - `insertNestedBlock(parentId, slotName, childTree, layout?)`: Adds a child under the specified slot and updates hierarchy/maps.
  - `promoteToTopLevel(blockId, layout?)`: Detaches a nested block, turns it into its own tree, and updates hierarchy + tree index to point to the new root.
  - `moveBlock(blockId, targetParentId, targetSlot = "main", layout?)`: Handles the four move scenarios (same parent, new parent in same tree, move between trees, promotion to top-level).
  - `getBlock`, `getAllBlocks`, `getTopLevelBlocks`: Fetch `EditorBlockInstance`s on demand.
  - `getParent`, `getChildren`, `getDescendants`, `isDescendantOf`, `updateHierarchy`: Relationship queries/utilities.
  - `updateUIMetadata(blockId, metadata)`: Merge UI-only flags.
  - `duplicateBlock(blockId)`: Clone a block tree; if the original was top level a new tree instance is added, otherwise a nested copy is inserted into the same parent.
  - `exportToServer()`: Returns the metadata plus top-level trees + layouts for persistence.
  - `clear()`: Resets to a fresh environment.

All mutating functions call `updateMetadata` to refresh the environment’s `updatedAt` timestamp.

---

### 3. Rendering & Grid Integration

#### 3.1 GridStack context
- `GridProvider` (`components/feature-modules/grid/provider/grid-provider.tsx`) owns the GridStack instance and exposes helper setters (`_gridStack`, `_rawWidgetMetaMap`).
- It takes the list of widgets (derived from layout rectangles) and synchronises them with GridStack, providing hooks to add/remove widgets programmatically.

#### 3.2 Demo wiring
- `BlockEnvironmentProvider` is mounted in `block-demo.tsx`, seeded with two `EditorTreeInstance`s via `createDemoTrees()`.
- `GridStackWidgetSync` monitors the list of top-level `EditorBlockInstance`s and keeps GridStack widgets in sync with additions/removals.
- `useEnvironmentGridSync` listens to GridStack move/resize events so layout changes propagate back to the provider.

#### 3.3 Panel wrapper rendering
- `EditorPanelWidget` (`components/.../panel/editor-panel.tsx`) is the GridStack widget renderer. It never represents a block type itself; instead it wraps whichever block tree is being edited in a `PanelWrapper` that provides editor chrome (toolbar, focus, slash menu, quick actions).
- Every block rendered through the editor is wrapped in `PanelWrapper`. The wrapper delegates the actual component rendering to `RenderBlock`, but adds the contextual UI affordances.
- Nested panels are rendered recursively by enumerating `getChildren(blockId)` so the visual hierarchy mirrors the underlying `hierarchy` map.
- `RenderBlock` (`components/.../components/render.tsx`) hydrates the block’s `display.render` structure into actual GridStack widgets and uses `RenderElementProvider` to render the individual block components from the registry.

---

### 4. How Layouts Tie Together

1. **Top-level layout**  
   - Each tree root has a layout rect in `environment.layouts`.  
   - `buildGridOptions` (in the demo) maps these to GridStack widget definitions (`content: { type: "EDITOR_PANEL", blockId }`).

2. **Nested layout**  
   - Child blocks live only inside their parent `BlockTree`. They are rendered inside the `EditorPanel` tree view; nested GridStack containers (for layout containers/lists) are handled by the component’s own render structure (`slotLayout` in block definitions).
   - The environment still keeps a layout rect for each child block (used for duplication/moves and future persistence) even though GridStack currently only positions top-level panels.

3. **Moving blocks**  
   - Dragging a top-level widget triggers GridStack events captured by `useEnvironmentGridSync`, which calls `moveBlock`/`updateLayout` as needed.
   - When a child is dropped onto the top-level grid (parent becomes `null`), `moveBlock` detaches it from the old tree, wraps it in a new `EditorTreeInstance`, and inserts a fresh widget into GridStack.
   - Moving a child into another panel slot updates both tree structures (`detachNode` + `insertNode`) and the hierarchy map to reflect the new parent.

4. **Deleting / promoting**  
   - Deleting a panel uses `removeBlock`. If the panel is a top-level tree, all descendants living in that tree are removed. Blocks that were previously promoted (and now live in their own tree instance) stay untouched because they have a different `treeId`.
   - Promoting a child relies on `detachNode` to carve out the sub-tree and rehydrate it as a top-level tree instance; the old parent tree is updated without that node.

---

### 5. Component Registry & Bindings

- Block components (e.g. `LAYOUT_CONTAINER`, `LINE_ITEM`, `TEXT`) are registered in `util/block.registry.tsx`. They define the binding schemas used by `RenderBlock`.
- Bespoke block types (reference blocks, layout container, list) are defined in `util/block-type-presets.ts` and used by the demo factories to ensure payloads match backend expectations.
- Bindings are applied via `util/block.binding.ts`, which reads from node payloads/references and feeds props into React components.

---

### 6. Interaction Summary

| Interaction | Key Functions | Outcome |
|-------------|---------------|---------|
| Add new top-level block | `addBlock(tree)` | New `EditorTreeInstance`; layout slot assigned; GridStack widget added. |
| Insert nested block | `insertNestedBlock(parentId, slot, tree)` | Child node added to parent tree; hierarchy updated; layout stored. |
| Move block to another parent | `moveBlock(blockId, targetParentId, slot)` | Node detached from old parent, inserted into new parent tree (possibly new tree), layout recalculated. |
| Promote child to top level | `promoteToTopLevel(blockId)` / `moveBlock(blockId, null)` | Child becomes new tree root; old parent updated; new widget appears. |
| Delete block | `removeBlock(blockId)` | Removes tree or prunes node; descendants removed unless they were previously promoted to their own tree. |
| Duplicate block | `duplicateBlock(blockId)` | Clone block tree; top-level vs nested behaviour depends on original parent. |
| Export layout | `exportToServer()` | Returns metadata and top-level tree instances + layout rectangles for persistence. |

---

### 7. Future Considerations

- **Undo/redo** will likely wrap mutations in commands that snapshot before/after states.
 - **Persistence**: when wiring to real endpoints we will serialise the top-level trees (and their layout rects) returned by `exportToServer`.
 - **Performance**: current helpers clone trees naïvely; if we hit performance issues we can introduce structural sharing or tree cursors.

This design keeps the distinction between “block” and “block tree” explicit. Only top-level trees become GridStack widgets; every other block lives exclusively inside its parent tree but can be promoted to a top-level tree through the provider APIs.
