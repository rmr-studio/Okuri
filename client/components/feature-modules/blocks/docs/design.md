# Block Building Environment - Design & Implementation Overview

**Last Updated:** 2025-10-25
**Post Git Stash - Current State Documentation**

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Core Domain Model](#core-domain-model)
4. [Block Rendering System](#block-rendering-system)
5. [Grid Layout Integration](#grid-layout-integration)
6. [Data Binding Engine](#data-binding-engine)
7. [Component Registry](#component-registry)
8. [State Management](#state-management)
9. [API Integration Layer](#api-integration-layer)
10. [User Interactions](#user-interactions)
11. [Key Design Patterns](#key-design-patterns)
12. [Implementation Details](#implementation-details)
13. [Current Gaps & Future Work](#current-gaps--future-work)

---

## Executive Summary

### What is the Block Building Environment?

The Block Building Environment is a **declarative, data-driven UI framework** that allows users to create, arrange, and interact with complex layouts composed of reusable components ("blocks"). The system is built on three fundamental principles:

1. **Schema-Driven**: All block structures are defined by JSON schemas (BlockType) stored in the backend
2. **Declarative Rendering**: Block layouts are described in BlockRenderStructure, not imperative React code
3. **Dynamic Composition**: Blocks can be nested, reference external data, and support conditional rendering

### Key Capabilities

- **Grid-Based Layouts**: Powered by GridStack.js for responsive drag-and-drop interfaces
- **Nested Composition**: Blocks can contain other blocks via slot-based nesting
- **Data Binding**: Declarative bindings map backend data to component props
- **Conditional Visibility**: Components can show/hide based on data conditions
- **Type Safety**: Full TypeScript integration from OpenAPI schemas
- **Real-Time Editing**: Immediate visual feedback with deferred persistence

### Technology Stack

- **Frontend**: React 18, TypeScript
- **Layout Engine**: GridStack.js v12.3.3
- **Validation**: Zod schemas
- **State**: React Context + local state (minimal global state)
- **Styling**: Tailwind CSS + shadcn/ui components
- **API**: OpenAPI-generated types with auto-sync

---

## System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interface Layer                      │
│  (Panel Wrappers, Toolbars, Modals, Keyboard Shortcuts)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      Component Layer                             │
│  - Primitive Blocks (Text, Button, Container, List, Table)     │
│  - Bespoke Blocks (ContactCard, AddressCard, TaskCard, etc.)   │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Rendering Engine                              │
│  - RenderBlock (main coordinator)                               │
│  - BlockElementsRenderer (wrapper with UI chrome)               │
│  - Binding Resolution (DataPath, RefSlot)                       │
│  - Visibility Evaluation (Condition operators)                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                    Layout Management                             │
│  - GridStack Integration (drag/drop/resize)                     │
│  - Grid Providers (GridProvider, GridContainerProvider)         │
│  - Layout Serialization (GridStack ↔ BlockRenderStructure)     │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      Data Layer                                  │
│  - BlockTree (domain model from API)                            │
│  - BlockType (schema definitions)                               │
│  - Block Controllers (CRUD operations)                          │
└─────────────────────────────────────────────────────────────────┘
                         │
                    Backend API
```

### Module Structure

```
components/feature-modules/
├── blocks/                          # Core block system
│   ├── components/                  # React components
│   │   ├── primitive/              # Basic blocks (5 types)
│   │   ├── bespoke/                # Domain-specific blocks (4 types)
│   │   ├── panel/                  # Panel UI components
│   │   ├── modals/                 # Insert & action dialogs
│   │   └── demo/                   # Playground/testing
│   ├── util/                       # Core utilities
│   │   ├── block.binding.ts        # Data binding engine
│   │   ├── block.visibility.ts     # Conditional rendering
│   │   ├── block.layout.ts         # Layout serialization
│   │   ├── block.registry.tsx      # Component registry
│   │   └── block.focus-manager.ts  # Selection management
│   ├── controller/                 # API layer
│   │   ├── block.controller.ts     # Block CRUD
│   │   └── block-type.controller.ts # Schema management
│   └── interface/                  # TypeScript types
│       └── block.interface.ts      # OpenAPI exports
│
├── grid/                           # Grid layout system
│   ├── provider/                   # Context providers
│   │   ├── grid-provider.tsx       # GridStack instance
│   │   ├── grid-container-provider.tsx # DOM tracking
│   │   └── grid-widget-provider.tsx # Widget rendering
│   ├── widgets/                    # Grid-specific widgets
│   │   ├── atomic/                 # Basic widgets (7 types)
│   │   └── composite/              # Complex widgets (6 types, WIP)
│   └── util/
│       └── widget.registry.tsx     # Widget definitions
│
└── render/                         # Shared rendering utilities
    ├── provider/
    │   └── render-element-provider.tsx
    └── util/
        └── render-element.registry.ts
```

---

## Core Domain Model

### Type Hierarchy (from OpenAPI)

The domain model is auto-generated from the backend OpenAPI specification:

```typescript
// lib/types/types.ts - components["schemas"]

Block                    // Individual block instance
├── id: UUID            // Unique identifier
├── name?: string       // Display name
├── organisationId      // Owner organization
├── type: BlockType     // Schema definition
├── payload: BlockMetadata // Actual data
├── archived: boolean
├── validationErrors?: string[]
└── timestamps (createdAt, updatedAt, createdBy, updatedBy)

BlockType               // Block schema definition
├── id: UUID
├── key: string         // Unique type identifier (e.g., "contact-overview")
├── version: number     // Schema version
├── name: string        // Display name
├── nesting?: BlockTypeNesting // Nesting rules
├── strictness: "SOFT" | "STRICT" | "NONE"
├── schema: BlockSchema // Data validation schema
├── display: BlockDisplay // Rendering configuration
│   ├── form: BlockFormStructure
│   └── render: BlockRenderStructure
└── timestamps

BlockTree               // Hierarchical block with children
├── maxDepth: number    // Max nesting level
├── expandRefs: boolean // Whether refs are populated
└── root: BlockNode

BlockNode               // Node in block tree
├── block: Block
├── children: Record<slotName, BlockNode[]>
├── references: Record<slotName, BlockReferenceObject[]>
└── warnings: string[]

BlockMetadata          // Block payload
├── data: Record<string, unknown>  // User data
├── refs: BlockReferenceObject[]   // Links to other entities
└── meta: BlockMeta                // Validation results
```

### BlockRenderStructure (Layout Definition)

```typescript
BlockRenderStructure {
    version: number;                    // Schema version
    layoutGrid: LayoutGrid;             // Grid layout config
    components: Record<id, BlockComponentNode>; // Component definitions
    theme?: ThemeTokens;                // Optional theming
}

LayoutGrid {
    cols?: number;          // Grid columns (default 12)
    rowHeight?: number;     // Cell height in pixels
    width?: number;         // Container width
    margin?: number;        // Gap between items
    height?: number;        // Container height
    items: GridItem[];      // Layout items with positions
}

GridItem {
    id: string;             // Component ID reference
    sm?: GridRect;          // Small screen layout
    md?: GridRect;          // Medium screen layout
    lg: GridRect;           // Large screen layout (required)
}

GridRect {
    x: number;              // Column position (0-based)
    y: number;              // Row position (0-based)
    width: number;          // Width in columns
    height: number;         // Height in rows
    locked: boolean;        // Prevent interaction
}

BlockComponentNode {
    id: string;             // Unique component ID
    type: ComponentType;    // Component type (TEXT, CONTACT_CARD, etc.)
    props: Record<string, unknown>;  // Static props
    bindings: BlockBinding[];        // Dynamic data bindings
    slots?: Record<slotName, string[]>; // Child component IDs
    slotLayout?: Record<slotName, LayoutGrid>; // Nested layouts
    visible?: Condition;    // Conditional rendering
    fetchPolicy: "INHERIT" | "LAZY" | "EAGER";
}
```

### BlockBinding (Data Mapping)

```typescript
BlockBinding {
    prop: string;           // Target component prop name
    source: BindingSource;  // Data source
}

BindingSource = DataPath | RefSlot | Computed

DataPath {
    type: "DataPath";
    path: string;           // JSON Pointer or shorthand (e.g., "name" or "/data/client/name")
}

RefSlot {
    type: "RefSlot";
    slot: string;           // Slot name (e.g., "contacts", "tasks")
    presentation: "SUMMARY" | "INLINE";
    fields?: string[];      // Fields to project (for SUMMARY)
    expandDepth?: number;   // How deep to expand refs
}

Computed {
    type: "Computed";
    expr: string;           // Expression to evaluate
    engine: string;         // Expression engine (future)
}
```

### BlockReference (Entity Links)

```typescript
BlockReferenceObject {
    id: UUID;               // Reference ID
    entityType: "LINE_ITEM" | "CLIENT" | "COMPANY" | "INVOICE" |
                "BLOCK" | "REPORT" | "DOCUMENT" | "PROJECT";
    entityId: UUID;         // Referenced entity ID
    entity?: any;           // Populated entity (if expandRefs=true)
    ownership: "OWNED" | "LINKED";  // Cascade delete behavior
    orderIndex?: number;    // Ordering in list
    path: string;           // JSON Pointer to data location
}
```

---

## Block Rendering System

### RenderBlock Component (render.tsx)

The `RenderBlock` component is the core rendering engine. It orchestrates the entire rendering pipeline.

**Props:**
```typescript
interface RenderBlockProps {
    tree: BlockTree;                    // Block data tree
    display: BlockRenderStructure;      // Layout definition
    onDelete?: (blockId: string) => void;
    onDuplicate?: (blockId: string) => void;
    onInsert?: (item: SlashItem, slotName?: string) => void;
    onSave?: (updatedDisplay: BlockRenderStructure) => void;
}
```

**Rendering Pipeline:**

1. **Initialization**
   ```typescript
   // Create mutable copy for immediate feedback
   const [internalStructure, setInternalStructure] = useState(display);

   // Create data context
   const ctx: TreeCtx = {
       payload: tree.root.block.payload.data,
       references: tree.root.references
   };
   ```

2. **Grid Configuration**
   ```typescript
   const gridOptions = useMemo(() => buildGridOptions(
       internalStructure.layoutGrid,
       internalStructure.components,
       ctx
   ), [internalStructure, ctx]);
   ```

3. **Widget Building**
   ```typescript
   function buildWidgetForComponent(
       item: GridItem,
       component: BlockComponentNode,
       ctx: TreeCtx
   ): GridStackWidget | null {
       // Apply bindings
       const resolvedProps = applyBindings(component, ctx);

       // Check visibility
       if (component.visible && !evalVisible(component.visible, ctx)) {
           return null;
       }

       // Validate props
       const validated = validateProps(component.type, resolvedProps);

       // Create widget
       return {
           id: item.id,
           ...pickRect(item, 'lg'),
           content: JSON.stringify({
               id: item.id,
               type: component.type,
               data: validated
           })
       };
   }
   ```

4. **Nested Rendering**
   ```typescript
   // For components with slots (e.g., LAYOUT_CONTAINER)
   if (component.slots) {
       Object.entries(component.slots).forEach(([slotName, childIds]) => {
           const slotLayout = component.slotLayout?.[slotName];
           // Recursively render children
       });
   }
   ```

5. **Layout Export**
   ```typescript
   useBlockLayoutExporter({
       onExport: (updatedDisplay) => {
           setInternalStructure(updatedDisplay);
           onSave?.(updatedDisplay);
       }
   });
   ```

### BlockElementsRenderer Component

Wraps each rendered block with UI chrome:

```typescript
<BlockElementsRenderer
    element={element}
    onDelete={() => handleDelete(element.id)}
    allowInsert={hasSlots}
    onInsert={(item, slot) => handleInsert(item, slot)}
/>
```

Features:
- Selection management (focus stack)
- Keyboard shortcuts (Delete, Cmd+E, Cmd+K)
- Context menu for actions
- Inline insert menu (/)
- Title editing
- Mode toggle (display/form)

---

## Grid Layout Integration

### GridStack.js Integration

The grid system uses GridStack.js v12.3.3 for layout management:

```typescript
// Grid configuration
const gridOptions: GridStackOptions = {
    acceptWidgets: true,        // Allow widget drops
    columnOpts: {
        breakpointForWindow: true,
        breakpoints: [
            { c: 1, w: 700 },   // Mobile
            { c: 3, w: 850 },   // Tablet
            { c: 6, w: 950 },   // Small laptop
            { c: 8, w: 1100 },  // Medium laptop
            // 12 columns for desktop
        ],
        layout: "moveScale",
        columnMax: 12
    },
    margin: 8,
    cellHeight: 50,
    subGridOpts: {              // Nested grid config
        acceptWidgets: true,
        subGridDynamic: true,
        margin: 8,
        minRow: 2,
        cellHeight: 50
    },
    children: [...]             // Initial widgets
};
```

### Grid Provider Architecture

```typescript
<GridProvider initialOptions={gridOptions}>
    <GridContainerProvider>
        <WidgetRenderProvider registry={blockElements} onDelete={handleDelete}>
            {/* Rendered content */}
        </WidgetRenderProvider>
    </GridContainerProvider>
</GridProvider>
```

**GridProvider** (`grid/provider/grid-provider.tsx`)
- Manages GridStack instance state
- Provides widget lifecycle methods (add/remove)
- Maintains widget metadata map
- Handles sub-grid creation

**GridContainerProvider** (`grid/provider/grid-container-provider.tsx`)
- Initializes GridStack on mount
- Tracks widget DOM elements (WeakMap)
- Provides widget container lookup
- Handles option updates

**WidgetRenderProvider** (`grid/provider/grid-widget-provider.tsx`)
- Wraps RenderElementProvider
- Injects `_onDelete` callback
- Handles unknown types

### Layout Synchronization

The `block.layout.ts` utility syncs GridStack DOM state back to BlockRenderStructure:

```typescript
function buildDisplayFromGridState(
    widgets: GridStackWidget[],
    previousDisplay: BlockRenderStructure
): BlockRenderStructure {
    // 1. Parse widget content JSON
    // 2. Map GridStack positions to GridItems
    // 3. Update layoutGrid.items
    // 4. Preserve component definitions
    // 5. Update slot assignments for nested content
    // 6. Extract sub-grid configurations

    return updatedDisplay;
}
```

This enables:
- Drag-and-drop repositioning
- Resize operations
- Layout persistence
- Real-time preview

---

## Data Binding Engine

### Binding Resolution (block.binding.ts)

The binding engine maps data from the block payload to component props:

```typescript
function applyBindings(
    node: BlockComponentNode,
    ctx: TreeCtx
): Record<string, any> {
    const result = { ...node.props };

    for (const binding of node.bindings) {
        const value = resolveBinding(binding.source, ctx);
        setDeep(result, binding.prop, value);
    }

    return result;
}
```

### Binding Types

#### 1. DataPath Binding

Maps data from the block payload:

```typescript
// Binding definition
{
    prop: "name",
    source: { type: "DataPath", path: "client.name" }
}

// Resolution
const value = getByPath(ctx.payload, "client.name");
// Gets: ctx.payload.client.name

// Shorthand support
"name" → "/data/name"
"client.email" → "/data/client/email"
```

#### 2. RefSlot Binding

Maps child block references to props:

```typescript
// Binding definition
{
    prop: "contacts",
    source: {
        type: "RefSlot",
        slot: "contacts",
        presentation: "SUMMARY",
        fields: ["name", "email", "phone"]
    }
}

// Resolution (SUMMARY mode)
const refs = ctx.references["contacts"] || [];
const value = refs.map(ref => ({
    name: ref.entity?.name,
    email: ref.entity?.email,
    phone: ref.entity?.phone
}));

// Resolution (INLINE mode)
const value = refs.filter(ref => ref.entityType === "BLOCK");
// Returns block references for nested rendering
```

#### 3. Computed Binding (Future)

Placeholder for computed expressions:

```typescript
{
    prop: "total",
    source: {
        type: "Computed",
        expr: "sum(items.*.price)",
        engine: "jsonata"
    }
}
```

### Path Resolution

The binding engine supports multiple path formats:

```typescript
// JSON Pointer (RFC 6901)
"/data/client/name" → ctx.payload.data.client.name

// Shorthand (auto-prefixed with /data/)
"client.name" → ctx.payload.data.client.name

// Array indexing
"items/0/name" → ctx.payload.data.items[0].name
```

---

## Component Registry

### Registry Structure (block.registry.tsx)

```typescript
type BlockElementType =
    | "TEXT"
    | "BUTTON"
    | "LAYOUT_CONTAINER"
    | "TABLE"
    | "LIST"
    | "CONTACT_CARD"
    | "ADDRESS_CARD"
    | "LINE_ITEM"
    | "IMAGE"
    | "ATTACHMENT"
    | "FALLBACK";

interface RenderElement<T extends ZodTypeAny> {
    type: BlockElementType;
    name: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    schema: T;
    component: ComponentType<z.infer<T>>;
    category: "BLOCK" | "SHARED";
}

const blockElements: Record<BlockElementType, RenderElement<any>> = {
    TEXT: createRenderElement({...}),
    BUTTON: createRenderElement({...}),
    // ... all component types
    FALLBACK: createRenderElement({...})  // Default for unknown types
};
```

### Component Lookup

```typescript
function resolveComponent(type: BlockElementType) {
    return blockElements[type] || blockElements.FALLBACK;
}
```

### Schema Validation

Each component has a Zod schema for prop validation:

```typescript
// Example: TextBlock schema
const TextBlockPropsSchema = z.object({
    content: z.string(),
    variant: z.enum(["title", "subtitle", "body", "muted"]).optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    className: z.string().optional()
});
```

---

## State Management

### Current Approach

The block system uses **minimal global state**:

1. **React Local State** - For UI interactions (hover, selection, modals)
2. **Mutable Copies** - In RenderBlock for immediate feedback
3. **Context Providers** - For scoped state (Grid, Playground)
4. **Focus Manager** - Global selection stack (not React Context)

### PlaygroundContext (Demo Only)

Used in `block-demo.tsx` for testing without backend:

```typescript
interface PlaygroundBlock {
    kind: "panel" | "block";
    id: string;
    title: string;
    tree: BlockTree;
    display: BlockRenderStructure;
    layout: LayoutRect;
    allowInsert: boolean;
    children?: PlaygroundBlock[];
}

const PlaygroundContext = {
    blocks: PlaygroundBlock[];
    insertPanel(block: PlaygroundBlock): void;
    insertNested(parentId: string, child: PlaygroundBlock): void;
    duplicatePanel(id: string): void;
    removePanel(id: string): void;
    applyLayouts(layouts: Record<string, LayoutRect>): void;
};
```

### Focus Manager (block.focus-manager.ts)

Global selection stack using listener pattern:

```typescript
interface FocusEntry {
    type: "panel" | "block";
    id: string;
    onDelete?: () => void;
}

// Global API
focusManager.pushSelection(entry);
focusManager.removeSelection(type, id);
focusManager.clearSelection();
focusManager.subscribe(listener);

// Keyboard event handling
document.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && !isInputFocused()) {
        focusManager.deleteSelectedItem();
    }
});
```

---

## API Integration Layer

### Block Controller (controller/block.controller.ts)

CRUD operations for blocks:

```typescript
// Fetch block tree
export async function getBlock(
    blockId: string,
    expandRefs: boolean = true,
    maxDepth: number = 10
): Promise<BlockTree> {
    const { data } = await API.GET("/api/v1/block/{blockId}", {
        params: {
            path: { blockId },
            query: { expandRefs, maxDepth }
        }
    });
    return data as BlockTree;
}

// Create block
export async function createBlock(
    request: CreateBlockRequest
): Promise<Block> {
    const { data } = await API.POST("/api/v1/block/", {
        body: request
    });
    return data as Block;
}

// Update block
export async function updateBlock(
    blockId: string,
    request: Block
): Promise<Block> {
    const { data } = await API.PUT("/api/v1/block/{blockId}", {
        params: { path: { blockId } },
        body: request
    });
    return data as Block;
}

// Delete block
export async function deleteBlockById(
    blockId: string,
    body: Block
): Promise<void> {
    await API.DELETE("/api/v1/block/{blockId}", {
        params: { path: { blockId } },
        body
    });
}

// Archive block
export async function updateArchiveStatusByBlockId(
    blockId: string,
    status: boolean,
    body: Block
): Promise<void> {
    await API.PUT("/api/v1/block/{blockId}/archive/{status}", {
        params: { path: { blockId, status } },
        body
    });
}
```

### Block Type Controller (controller/block-type.controller.ts)

Schema management:

```typescript
// Publish block type
export async function publishBlockType(
    request: CreateBlockTypeRequest
): Promise<BlockType> {
    const { data } = await API.POST("/api/v1/block/schema/", {
        body: request
    });
    return data as BlockType;
}

// Get block types for org
export async function getBlockTypes(
    organisationId: string
): Promise<BlockType[]> {
    const { data } = await API.GET(
        "/api/v1/block/schema/organisation/{organisationId}",
        { params: { path: { organisationId } } }
    );
    return data as BlockType[];
}

// Lint block type
export async function lintBlockType(
    blockType: BlockType
): Promise<LintIssue[]> {
    const { data } = await API.POST("/api/v1/block/schema/lint", {
        body: blockType
    });
    return data as LintIssue[];
}
```

---

## User Interactions

### Panel Wrapper (components/panel/panel-wrapper.tsx)

The PanelWrapper component provides the primary user interface:

**Features:**
1. **Display Mode** - Shows rendered content
2. **Form Mode** - Edit block data (future)
3. **Toolbar** - Mode toggle, actions menu
4. **Title Editing** - Inline title editing
5. **Insert Menu** - Slash command (/) for quick insert
6. **Quick Actions** - Cmd+K for actions menu
7. **Keyboard Shortcuts** - Cmd+E (mode), Delete (remove)

**State Management:**
```typescript
const [mode, setMode] = useState<"display" | "form">("display");
const [isHovered, setIsHovered] = useState(false);
const [isSelected, setIsSelected] = useState(false);
const [showInlineMenu, setShowInlineMenu] = useState(false);
const [title, setTitle] = useState(initialTitle);
```

**Keyboard Handling:**
```typescript
useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === '/' && !isInputFocused()) {
            e.preventDefault();
            setShowInlineMenu(true);
        }

        if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
            e.preventDefault();
            toggleMode();
        }

        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            openQuickActions();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Insert Block Modal (components/modals/insert-block-modal.tsx)

Command palette for inserting blocks:

**Features:**
- Fuzzy search
- Keyboard navigation (arrows, Enter, Escape)
- Categorized results
- Recent selections

**SlashItem Structure:**
```typescript
interface SlashItem {
    id: string;
    label: string;
    description?: string;
    category: "Blocks" | "Bespoke" | "Actions";
    icon?: ComponentType;
    keywords: string[];
    action: () => void;
}
```

### Quick Action Modal (components/modals/quick-action-modal.tsx)

Context menu for block operations:

**Actions:**
- Duplicate block
- Delete block
- Archive block
- Copy ID
- View JSON
- Toggle lock

---

## Key Design Patterns

### 1. Schema-Driven UI

Everything is defined by JSON schemas stored in the backend:

```typescript
// Block type defines structure
const blockType: BlockType = {
    key: "contact-overview",
    name: "Contact Overview",
    schema: {
        type: "OBJECT",
        properties: {
            client: { type: "OBJECT", ... },
            tasks: { type: "ARRAY", ... }
        }
    },
    display: {
        render: {
            layoutGrid: {...},
            components: {...}
        }
    }
};

// Frontend renders from schema
<RenderBlock tree={blockTree} display={blockType.display.render} />
```

**Benefits:**
- Backend controls UI structure
- Version management
- Multi-tenant customization
- No frontend deployments for layout changes

### 2. Declarative Bindings

Data mapping is declarative, not imperative:

```typescript
// Instead of:
<ContactCard
    name={block.payload.data.client.name}
    email={block.payload.data.client.email}
/>

// We define:
{
    type: "CONTACT_CARD",
    bindings: [
        { prop: "name", source: { type: "DataPath", path: "client.name" } },
        { prop: "email", source: { type: "DataPath", path: "client.email" } }
    ]
}
```

**Benefits:**
- Decouples component structure from data
- Reusable bindings
- Schema validation
- Easier testing

### 3. Composition via Slots

Nested content uses named slots:

```typescript
// Component definition
{
    type: "LAYOUT_CONTAINER",
    slots: {
        header: ["component-1"],
        main: ["component-2", "component-3"],
        sidebar: ["component-4"]
    },
    slotLayout: {
        main: { cols: 12, rowHeight: 40, items: [...] }
    }
}
```

**Benefits:**
- Semantic organization
- Flexible layouts
- Independent grid configs per slot
- Validation per slot

### 4. Registry Pattern

Components are looked up at runtime:

```typescript
// Registration
blockElements["CONTACT_CARD"] = createRenderElement({
    type: "CONTACT_CARD",
    component: ContactCard,
    schema: ContactCardPropsSchema,
    name: "Contact Card",
    description: "Display contact information"
});

// Resolution
const element = blockElements[componentType] || blockElements.FALLBACK;
```

**Benefits:**
- Dynamic component loading
- Fallback handling
- Schema-validated props
- Extensible (plugins)

### 5. Immediate Feedback with Deferred Persistence

UI updates happen immediately, persistence is deferred:

```typescript
// 1. User drags widget
// 2. GridStack updates DOM
// 3. RenderBlock updates local state (internalStructure)
// 4. Visual feedback is instant

// 5. Later: useBlockLayoutExporter() calls onSave
// 6. Parent component calls API to persist

const handleSave = async (updatedDisplay: BlockRenderStructure) => {
    const updatedBlock = {
        ...block,
        type: {
            ...block.type,
            display: {
                ...block.type.display,
                render: updatedDisplay
            }
        }
    };

    await updateBlock(block.id, updatedBlock);
};
```

**Benefits:**
- Instant user feedback
- Batched saves
- Optimistic updates
- Error handling separation

### 6. Container DOM Manipulation

The ContainerBlock uses MutationObserver to move GridStack subgrids:

```typescript
// Problem: GridStack renders subgrid outside container
// Solution: Watch for subgrid insertion and move it

const moveSubGrid = () => {
    const subGrid = gridItem.querySelector(".grid-stack-subgrid");
    if (subGrid && !host.contains(subGrid)) {
        host.appendChild(subGrid);  // Move into container
    }
};

const observer = new MutationObserver(moveSubGrid);
observer.observe(gridItem, { childList: true, subtree: true });
```

**Benefits:**
- Flexible nested layouts
- Preserves GridStack behavior
- Clean DOM structure
- No GridStack modification

---

## Implementation Details

### Component Implementations

#### Primitive Blocks

**TextBlock** (`components/primitive/block.text.tsx`)
```typescript
interface TextBlockProps {
    content: string;
    variant?: "title" | "subtitle" | "body" | "muted";
    align?: "left" | "center" | "right";
    className?: string;
}

// Renders styled text with variant classes
```

**ButtonBlock** (`components/primitive/block.button.tsx`)
```typescript
interface ButtonBlockProps {
    label: string;
    variant?: "default" | "secondary" | "destructive" | "ghost" | "outline";
    icon?: string;
    href?: string;
}

// Renders Button component with optional link
```

**ContainerBlock** (`components/primitive/block.container.tsx`)
```typescript
interface ContainerBlockProps {
    title?: string;
    children?: ReactNode;
    asCard?: boolean;
}

// Renders layout container with optional Card styling
// Uses MutationObserver to move subgrid DOM
```

**ListBlock** (`components/primitive/block.list.tsx`)
```typescript
interface ListBlockProps {
    items: Array<{
        type: "ADDRESS_CARD" | "PROJECT_TASK" | "INVOICE_LINE_ITEM";
        data: any;
    }>;
}

// Maps item types to renderers
// Supports custom item components
// Fallback to JSON display
```

**TableBlock** (`components/primitive/block.table.tsx`)
```typescript
interface TableBlockProps {
    title?: string;
    data: Record<string, any>;
}

// Displays key-value data as labeled values
// Normalizes values (dates, booleans, arrays)
```

#### Bespoke Blocks

**ContactCard** (`components/bespoke/ContactCard.tsx`)
```typescript
interface ContactCardProps {
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    account?: string;
    type?: string;
    avatarUrl?: string;
    avatarShape?: "circle" | "square";
    href?: string;
}

// Styled contact display card
// Avatar support
// Optional link
```

**AddressCard** (`components/bespoke/AddressCard.tsx`)
```typescript
interface AddressCardProps {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

// Formatted address display
// Card layout
```

**TaskCard** (`components/bespoke/TaskCard.tsx`)
```typescript
interface TaskCardProps {
    title: string;
    assignee?: string;
    status: "IN_PROGRESS" | "IN_REVIEW" | "NOT_STARTED" | "DONE";
    dueDate?: string;
}

// Task display with status badge
// Status-based color coding
// Date formatting
```

**InvoiceLineItemCard** (`components/bespoke/InvoiceLineItemCard.tsx`)
```typescript
interface InvoiceLineItemCardProps {
    name: string;
    description?: string;
    quantity: number;
    rate: number;
    total: number;
    currency?: string;
}

// Invoice line item display
// Currency formatting
```

### Utility Functions

**Path Resolution** (`util/block.binding.ts`)
```typescript
function getByPath(obj: any, pointer: string): any {
    // Supports JSON Pointer (RFC 6901)
    // Supports shorthand (auto-prefix /data/)
    // Handles arrays, objects, nulls
}

function setDeep(obj: any, path: string, value: any): void {
    // Sets nested properties safely
    // Creates intermediate objects
}
```

**Visibility Evaluation** (`util/block.visibility.ts`)
```typescript
function evalVisible(condition: Condition, ctx: TreeCtx): boolean {
    // Operators: EXISTS, EMPTY, NOT_EMPTY, EQUALS, NOT_EQUALS,
    //            GT, GTE, LT, LTE, IN, NOT_IN

    // Example:
    // { op: "EXISTS", left: { kind: "Path", path: "email" } }
    // → Returns true if ctx.payload.email exists
}
```

**Layout Serialization** (`util/block.layout.ts`)
```typescript
function buildDisplayFromGridState(
    widgets: GridStackWidget[],
    previousDisplay: BlockRenderStructure
): BlockRenderStructure {
    // Converts GridStack DOM state to BlockRenderStructure
    // Preserves component definitions
    // Updates layout metadata
    // Handles nested subgrids
}
```

---

## Current Gaps & Future Work

### Implemented Features

- Core rendering pipeline
- Grid-based layouts with GridStack
- Data binding (DataPath, RefSlot)
- Conditional visibility
- Component registry
- Primitive blocks (5 types)
- Bespoke blocks (4 types)
- Panel UI with toolbar
- Insert block modal
- Quick action modal
- Focus manager
- API controllers
- TypeScript types from OpenAPI

### Gaps & TODOs

**From Code Comments:**

1. **PanelActionProvider** (`context/panel-action-provider.tsx`)
   - Empty file, needs implementation
   - Goal: Reduce prop drilling in PanelWrapper

2. **Form Mode** (`components/panel/panel-block-form.tsx`)
   - Not fully implemented
   - Goal: Edit block data in-place

3. **Computed Bindings** (`util/block.binding.ts`)
   - MVP placeholder only
   - Goal: Expression evaluation (e.g., JSONata)

4. **GridStack Change Event** (`grid/provider/grid-container-provider.tsx`)
   - Change event not firing on nested grids
   - Known issue: https://github.com/gridstack/gridstack.js/issues/2671

5. **Widget Implementations** (grid module)
   - MediaWidget - Schema exists, component is placeholder
   - TableWidget - Schema exists, component is placeholder
   - DateWidget - Schema exists, component is placeholder
   - ChartWidget - Extensive schema, component is placeholder
   - Composite widgets (Header, Footer, Summary, etc.) - Mostly placeholders

### Future Enhancements

**High Priority:**
1. Undo/redo system
2. Real-time collaboration
3. Block templates
4. Copy/paste between environments
5. Block search and filtering
6. Performance optimization for large trees

**Medium Priority:**
1. Keyboard shortcuts expansion
2. Block versioning
3. Computed bindings with expressions
4. Custom validation rules
5. Block permissions/access control
6. Analytics/telemetry

**Low Priority:**
1. Block marketplace
2. AI-assisted block creation
3. Mobile support
4. Offline mode
5. Export to other formats (HTML, PDF, etc.)

---

## Architecture Strengths

### What Makes This System Unique

1. **Backend-Driven UI**: Schema defines structure, not frontend code
2. **Type Safety**: Full TypeScript from OpenAPI with auto-sync
3. **Declarative Everything**: Layouts, bindings, visibility all in JSON
4. **Flexible Composition**: Slot-based nesting with independent layouts
5. **Real-Time Ready**: GridStack + optimistic updates enable collaboration
6. **Domain-Agnostic Core**: Primitive blocks + bespoke extensions pattern
7. **Clean Separation**: Data (BlockTree) separate from layout (BlockRenderStructure)
8. **Extensible Registry**: Components can be added without code changes

### Comparison to Other Systems

**vs. Traditional Component Libraries (Material-UI, Ant Design)**
- Not a component library, but a UI framework
- Components are data, not code
- Layouts stored in database, not JSX

**vs. Headless CMS (Contentful, Sanity)**
- Simpler data model (no rich text, media management)
- Real-time editing focus
- Custom domain components (invoices, tasks, contacts)
- Tight backend coupling (not content-agnostic)

**vs. Page Builders (Webflow, Wix)**
- Code-first, not WYSIWYG
- Full TypeScript type safety
- Backend controls structure
- Render anywhere (not web-only)

**vs. Low-Code Platforms (Retool, Bubble)**
- Open source potential
- Full customization
- No vendor lock-in
- Programmer-friendly

---

## File Reference

### Blocks Module

**Core Rendering:**
- [components/render.tsx](components/render.tsx) - Main rendering engine (527 lines)
- [util/block.binding.ts](util/block.binding.ts) - Data binding resolution (140 lines)
- [util/block.registry.tsx](util/block.registry.tsx) - Component registry (158 lines)

**Components:**
- [components/panel/panel-wrapper.tsx](components/panel/panel-wrapper.tsx) - Panel UI (462 lines)
- [components/primitive/*.tsx](components/primitive/) - 5 primitive blocks
- [components/bespoke/*.tsx](components/bespoke/) - 4 bespoke blocks

**Utilities:**
- [util/block.focus-manager.ts](util/block.focus-manager.ts) - Selection stack (95 lines)
- [util/block.layout.ts](util/block.layout.ts) - Layout serialization (206 lines)
- [util/block.visibility.ts](util/block.visibility.ts) - Conditional rendering (44 lines)

**API Layer:**
- [controller/block.controller.ts](controller/block.controller.ts) - Block CRUD (188 lines)
- [controller/block-type.controller.ts](controller/block-type.controller.ts) - Schema management (206 lines)

**Types:**
- [interface/block.interface.ts](interface/block.interface.ts) - OpenAPI exports (32 lines)

### Grid Module

**Providers:**
- [provider/grid-provider.tsx](../grid/provider/grid-provider.tsx) - GridStack instance (203 lines)
- [provider/grid-container-provider.tsx](../grid/provider/grid-container-provider.tsx) - DOM tracking (202 lines)
- [provider/grid-widget-provider.tsx](../grid/provider/grid-widget-provider.tsx) - Widget rendering (37 lines)

**Widgets:**
- [widgets/atomic/*.tsx](../grid/widgets/atomic/) - 7 atomic widgets
- [widgets/composite/*.tsx](../grid/widgets/composite/) - 6 composite widgets (WIP)

**Demo:**
- [demo/grid-demo.tsx](../grid/demo/grid-demo.tsx) - Full working example (456 lines)

### Types

- [lib/types/types.ts](../../../lib/types/types.ts) - Auto-generated OpenAPI schemas (3081 lines)

---

**End of Document**
