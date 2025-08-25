# Required Libraries for Organisation Tile Layout System

## Core Drag and Drop Libraries

### 1. react-beautiful-dnd (Recommended)

```bash
npm install react-beautiful-dnd @types/react-beautiful-dnd
```

-   **Purpose**: Provides smooth drag and drop functionality for reordering sections
-   **Features**:
    -   Drag handles
    -   Drop zones
    -   Smooth animations
    -   Accessibility support
    -   Touch device support

### 2. @dnd-kit/core (Alternative - More Modern)

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

-   **Purpose**: Modern, lightweight drag and drop library
-   **Features**:
    -   Modular architecture
    -   Better performance
    -   More customization options
    -   Built-in accessibility

## Resizable Components

### 3. react-resizable-panels

```bash
npm install react-resizable-panels
```

-   **Purpose**: For resizing sections within the tile
-   **Features**:
    -   Smooth resizing
    -   Minimum/maximum constraints
    -   Touch support

### 4. react-rnd (Alternative)

```bash
npm install react-rnd
```

-   **Purpose**: Resizable and draggable components
-   **Features**:
    -   Both drag and resize in one library
    -   Grid snapping
    -   Bounds constraints

## Grid and Layout Libraries

### 5. react-grid-layout

```bash
npm install react-grid-layout
```

-   **Purpose**: Grid-based layout system
-   **Features**:
    -   Responsive grid layouts
    -   Drag and drop positioning
    -   Resizable grid items
    -   Breakpoint support

### 6. @dnd-kit/grid (If using @dnd-kit)

```bash
npm install @dnd-kit/grid
```

-   **Purpose**: Grid-based drag and drop with @dnd-kit
-   **Features**:
    -   Grid snapping
    -   Collision detection
    -   Position calculation

## State Management

### 7. zustand (Already in use)

-   **Purpose**: Lightweight state management
-   **Features**:
    -   Simple API
    -   TypeScript support
    -   React integration

## UI Components (Already Available)

### 8. @radix-ui/react-dialog

-   **Purpose**: Modal dialogs for the layout editor
-   **Status**: Already available in the project

### 9. lucide-react

-   **Purpose**: Icons for the interface
-   **Status**: Already available in the project

## Recommended Implementation

For the best user experience, I recommend using:

1. **@dnd-kit/core** + **@dnd-kit/sortable** for drag and drop
2. **react-resizable-panels** for resizing
3. **react-grid-layout** for grid-based positioning

## Installation Command

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities react-resizable-panels react-grid-layout
```

## Alternative Lightweight Option

If you prefer a simpler approach with fewer dependencies:

```bash
npm install react-beautiful-dnd @types/react-beautiful-dnd
```

This provides both drag and drop functionality in a single library, though with less customization than the modular approach.
