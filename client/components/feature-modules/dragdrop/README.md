# Drag & Drop Grid System

A comprehensive, type-safe drag and drop system for building resizable, nestable grid layouts. This system provides a foundation for various application purposes including dashboards, page builders, and content management systems.

## 🚀 Features

-   **Type-Safe**: Full TypeScript support with proper type definitions
-   **Resizable**: Automatic panel resizing with size persistence
-   **Nestable**: Drag blocks onto others to create nested containers
-   **Validated**: Comprehensive validation for drop targets and block types
-   **Error Handling**: Robust error handling with detailed logging
-   **Extensible**: Easy to add new block types and behaviors
-   **Performance**: Optimized with proper memoization and callbacks

## 📁 Architecture

### Core Components

-   **`GridBlock`**: Unified component for rendering all block types
-   **`SortableItem`**: Wrapper for drag and drop functionality
-   **`SortableWrapper`**: Context provider for sortable operations

### Utilities

-   **`BlockTreeManager`**: Manages all block tree operations
-   **`DragRegistry`**: Registry of block types and their configurations
-   **`ErrorHandler`**: Comprehensive error handling and validation
-   **`CollisionDetection`**: Smart collision detection for drop targets

### Types

-   **`GridBlockProps`**: Main block interface
-   **`BlockDefinition`**: Block type configuration
-   **`BlockBehaviors`**: Behavior flags for blocks
-   **`DropValidation`**: Validation result interface

## 🎯 Block Types

### Leaf Blocks

-   **`displayBlock`**: Basic content display block
-   **`dashboardWidget`**: Dashboard widget with title and description

### Container Blocks

-   **`containerBlock`**: Horizontal resizable container
-   **`verticalContainerBlock`**: Vertical resizable container
-   **`dashboard`**: Dashboard container for widgets
-   **`invoicePage`**: Invoice page container

## 🔧 Usage

### Basic Example

```tsx
import { BlockEditorDemo } from "./demo/grid-builder";

export default function MyPage() {
    return <BlockEditorDemo />;
}
```

### Advanced Example

```tsx
import { ComprehensiveExample } from "./demo/comprehensive-example";

export default function AdvancedPage() {
    return <ComprehensiveExample />;
}
```

### Custom Block Types

```tsx
// Add to registry
export const DragRegistry: BlockRegistry = {
    // ... existing blocks
    myCustomBlock: {
        label: "My Custom Block",
        behaviors: { draggable: true, resizable: true },
        validParents: ["containerBlock", "verticalContainerBlock"],
        render: (id, data) => (
            <div className="p-4 bg-purple-100 rounded">
                <h3>{data?.title || `Custom Block ${id}`}</h3>
            </div>
        ),
        renderOverlay: (id, data) => (
            <div className="p-4 bg-purple-200 rounded opacity-80">
                <h3>{data?.title || `Custom Block ${id}`}</h3>
            </div>
        ),
    },
};
```

## 🛠️ API Reference

### BlockTreeManager

```tsx
const manager = createBlockTreeManager(initialBlocks);

// Add a block
manager.addBlock(parentId, blockType, data);

// Remove a block
manager.removeBlock(blockId);

// Move a block
manager.moveBlock(blockId, newParentId, index);

// Update a block
manager.updateBlock(blockId, updates);

// Resize a block
manager.resizeBlock(blockId, sizes);

// Handle drag and drop
const result = manager.handleDragDrop(activeId, overId);
```

### Block Definition

```tsx
interface BlockDefinition {
    label: string; // Human-readable name
    behaviors?: BlockBehaviors; // What the block can do
    validChildren?: string[]; // What can be dropped into it
    validParents?: string[]; // What it can be dropped into
    direction?: "row" | "column"; // Layout direction
    render?: (id, data) => ReactNode; // How to render the block
    renderOverlay?: (id, data) => ReactNode; // How to render drag overlay
}
```

### Block Behaviors

```tsx
interface BlockBehaviors {
    draggable?: boolean; // Can be dragged
    sortable?: boolean; // Can be sorted
    resizable?: boolean; // Can be resized
    nestable?: boolean; // Can contain other blocks
}
```

## 🎨 Styling

The system uses Tailwind CSS classes and follows a consistent design pattern:

-   **Containers**: `bg-gray-50 border rounded-lg shadow-sm`
-   **Blocks**: `bg-white border rounded-lg shadow-sm`
-   **Handles**: `bg-gray-300 hover:bg-gray-400`
-   **Errors**: `bg-red-100 border-red-300 text-red-600`

## 🔍 Validation

The system includes comprehensive validation:

-   **Block Structure**: Validates block IDs, types, and hierarchy
-   **Size Validation**: Ensures panel sizes sum to 100%
-   **Drop Validation**: Validates drop targets based on registry rules
-   **Data Validation**: Validates block-specific data requirements

## 🚨 Error Handling

Errors are categorized and handled gracefully:

-   **Validation Errors**: Invalid block structure or data
-   **Block Not Found**: Referenced block doesn't exist
-   **Invalid Operations**: Operations not allowed for block type
-   **Size Calculation Errors**: Issues with panel sizing
-   **Registry Errors**: Unknown block types or configurations

## 🧪 Testing

The system includes several demo components for testing:

-   **`BlockEditorDemo`**: Basic functionality
-   **`ComprehensiveExample`**: Full feature demonstration
-   **`GridEditor`**: Advanced editor with all features

## 🔄 Migration Guide

### From Old System

1. **Replace `ResizableContainer`** with `GridBlock`
2. **Update imports** to use new type definitions
3. **Use `BlockTreeManager`** for all operations
4. **Add validation** using `ErrorHandler`
5. **Update block definitions** in registry

### Breaking Changes

-   `GridBlockProps` interface has been updated
-   `ResizableContainer` component removed
-   Drag and drop logic completely rewritten
-   Size calculation logic improved

## 🎯 Best Practices

1. **Always validate** block data before operations
2. **Use the error handler** for proper error management
3. **Define proper block types** in the registry
4. **Handle edge cases** in custom block renderers
5. **Test thoroughly** with different block combinations

## 🚀 Future Enhancements

-   [ ] Undo/Redo functionality
-   [ ] Block templates and presets
-   [ ] Export/Import functionality
-   [ ] Real-time collaboration
-   [ ] Advanced animations
-   [ ] Accessibility improvements
-   [ ] Performance optimizations

## 📝 License

This system is part of the Okuri project and follows the same licensing terms.
