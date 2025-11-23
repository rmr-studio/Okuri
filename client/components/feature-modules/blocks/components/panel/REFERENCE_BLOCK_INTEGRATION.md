# Reference Block Entity Selection Integration Guide

This guide shows how to integrate the entity selection toolbar button with reference blocks.

## Overview

The toolbar now supports custom actions via the `customActions` prop. For reference blocks, we provide a `useReferenceBlockToolbar` hook that creates the "Select Entities" button and modal.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ Panel Wrapper / Editor Panel                       │
│  • Detects if block is entity reference            │
│  • Calls useReferenceBlockToolbar hook              │
│  • Passes customActions to PanelToolbar             │
│  • Renders modal from hook                          │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ PanelToolbar                                        │
│  • Renders custom action buttons                   │
│  • Shows "Select Entities" with badge (count)      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ EntitySelectorModal                                 │
│  • Opens when button clicked                       │
│  • Fetches available entities                      │
│  • User selects entities                           │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Hook updates block metadata                        │
│  • updateTrackedBlock() with new items             │
│  • Invalidates React Query cache                   │
│  • Triggers re-hydration                           │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ ReferenceBlock re-renders                          │
│  • useBlockHydration fetches new entity data       │
│  • Displays updated entities                       │
└─────────────────────────────────────────────────────┘
```

## Integration Steps

### Step 1: Update Panel Wrapper

In `panel-wrapper.tsx` or `editor-panel.tsx`, detect reference blocks and use the hook:

```typescript
import { useReferenceBlockToolbar } from "./toolbar/use-reference-block-toolbar";
import { isEntityReferenceMetadata } from "../../interface/block.interface";

// Inside your panel component
const block = getBlock(currentBlockId);
const isEntityReference = block && isEntityReferenceMetadata(block.payload);

// Use the hook for reference blocks
const referenceToolbar = isEntityReference
    ? useReferenceBlockToolbar({
          blockId: currentBlockId,
          entityType: block.payload.entityType || "CLIENT",
          currentItems: block.payload.items || [],
          multiSelect: true,
      })
    : null;

// Pass custom actions to toolbar
<PanelToolbar
    // ... existing props
    customActions={referenceToolbar?.customActions || []}
/>

{/* Render modal */}
{referenceToolbar?.modal}
```

### Step 2: Complete Example

Here's a complete example of integrating with your panel system:

```typescript
import { FC, useState } from "react";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useReferenceBlockToolbar } from "./toolbar/use-reference-block-toolbar";
import PanelToolbar from "./toolbar/panel-toolbar";
import { isEntityReferenceMetadata } from "../../interface/block.interface";

interface ExamplePanelWrapperProps {
    blockId: string;
    // ... other props
}

const ExamplePanelWrapper: FC<ExamplePanelWrapperProps> = ({ blockId }) => {
    const { getBlock } = useBlockEnvironment();
    const block = getBlock(blockId);

    // Detect if this is a reference block
    const isEntityReference = block && isEntityReferenceMetadata(block.payload);

    // Get reference block toolbar actions and modal
    const referenceToolbar = isEntityReference
        ? useReferenceBlockToolbar({
              blockId,
              entityType: block.payload.entityType || "CLIENT",
              currentItems: block.payload.items || [],
              multiSelect: true,
          })
        : null;

    return (
        <div className="panel-container">
            {/* Toolbar with custom actions */}
            <PanelToolbar
                visible={true}
                onQuickActionsClick={() => {}}
                allowInsert={true}
                // ... other required props
                customActions={referenceToolbar?.customActions || []}
            />

            {/* Panel content */}
            <div className="panel-content">
                {/* Your block rendering here */}
            </div>

            {/* Entity selector modal (only for reference blocks) */}
            {referenceToolbar?.modal}
        </div>
    );
};
```

### Step 3: Add Type Guard (if not exists)

Add this to `interface/block.interface.ts`:

```typescript
export function isEntityReferenceMetadata(
    payload: any
): payload is EntityReferenceMetadata {
    return payload && payload.type === "entity_reference";
}
```

## Features

### 1. Button with Badge

The "Select Entities" button shows a badge with the count of selected entities:

```
[👥] ← No entities selected (no badge)
[👥³] ← 3 entities selected (badge with count)
```

### 2. Multi-Select Support

```typescript
useReferenceBlockToolbar({
    multiSelect: true, // Checkboxes + confirm button
});

useReferenceBlockToolbar({
    multiSelect: false, // Immediate selection (no confirm)
});
```

### 3. Duplicate Prevention

Already-selected entities are excluded from the selector:

```typescript
excludeIds={currentItems.map((item) => item.id)}
```

### 4. Automatic Cache Invalidation

When entities are selected, the hydration cache is automatically invalidated, triggering a re-fetch:

```typescript
queryClient.invalidateQueries(["block-hydration", blockId]);
```

### 5. Dirty State Tracking

Using `updateTrackedBlock()` automatically marks the layout as dirty, enabling save/discard functionality.

## Testing

1. **Open a reference block**
   - Verify toolbar shows "Select Entities" button
   - Badge should show current count

2. **Click the button**
   - Modal opens with searchable entity list
   - Already-selected entities are excluded

3. **Select entities**
   - Single select: closes immediately
   - Multi-select: shows confirm button

4. **Verify update**
   - Block re-hydrates with new entities
   - Entity data displays correctly
   - Layout is marked dirty

5. **Save layout**
   - Click "Save Layout"
   - Reload page
   - Entities persist

## Extending to Other Entity Types

To add support for ORGANISATION, PROJECT, etc.:

### 1. Update EntitySelectorModal

In `entity-selector-modal.tsx`, add cases for new entity types:

```typescript
if (entityType === "ORGANISATION") {
    const organisations = await fetchOrganisations(session, organisationId);
    // ... map to EntityOption[]
}
```

### 2. Create Fetch Functions

Add service methods for fetching each entity type:

```typescript
// organisation.service.ts
export const fetchOrganisations = async (
    session: Session,
    organisationId: string
): Promise<Organisation[]> => {
    // ... implementation
};
```

### 3. Use in Hook

```typescript
useReferenceBlockToolbar({
    entityType: "ORGANISATION", // or "PROJECT", "INVOICE", etc.
    // ...
});
```

## Custom Actions for Other Block Types

The custom actions system is not limited to reference blocks. You can add custom toolbar actions for any block type:

```typescript
const customActions: CustomToolbarAction[] = [
    {
        id: "export-data",
        icon: <Download className="size-3.5" />,
        label: "Export data",
        onClick: () => handleExport(),
    },
    {
        id: "refresh",
        icon: <RefreshCw className="size-3.5" />,
        label: "Refresh",
        onClick: () => handleRefresh(),
        badge: "⚠️", // Warning badge
    },
];

<PanelToolbar customActions={customActions} />;
```

## Troubleshooting

### Button Not Showing

Check:
- `isEntityReferenceMetadata()` returns true
- `customActions` is passed to PanelToolbar
- Hook is called correctly

### Modal Not Opening

Check:
- `modal` from hook is rendered in component
- `onClick` handler is working

### Entities Not Updating

Check:
- `updateTrackedBlock()` is called
- `queryClient.invalidateQueries()` is called
- Block ID matches

### Hydration Not Working

Check:
- Backend `/hydrate` endpoint is working
- `organisationId` is correct
- Block metadata has `items` array

## Summary

✅ Toolbar now supports custom actions via `customActions` prop
✅ `useReferenceBlockToolbar` hook provides entity selection
✅ Button shows badge with entity count
✅ Modal handles search, multi-select, duplicate prevention
✅ Automatic cache invalidation and re-hydration
✅ Dirty state tracking for save/discard
✅ Extensible to other entity types and custom actions

The implementation is complete and ready to integrate into your panel system!
