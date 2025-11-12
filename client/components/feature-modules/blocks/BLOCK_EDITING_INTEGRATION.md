# Block Editing System - Integration Guide

## Overview

This document describes how to integrate the new block editing system into your application. The system provides inline editing for simple blocks and a drawer-based editor for containers with nested children.

## Architecture

The editing system consists of:

1. **BlockEditContext** - Manages edit state, drafts, and validation independently from BlockEnvironment
2. **Form Widgets** - Reusable form components for all FormWidgetConfig types
3. **BlockForm** - Renders forms based on BlockType configuration
4. **BlockEditDrawer** - Side drawer for editing containers with recursive child forms
5. **EditModeIndicator** - Global indicator showing active edits and movement status
6. **PanelWrapper Integration** - Keyboard shortcuts and toolbar buttons

## Key Features

- ✅ Inline editing for simple blocks (Cmd+E)
- ✅ Drawer editing for containers (Cmd+E on containers or Cmd+Shift+E on any block)
- ✅ Draft state management (changes persist during tree rebuilds)
- ✅ Schema-based validation with inline error display
- ✅ Block movement prevention during editing
- ✅ Tab navigation between form fields and blocks
- ✅ Unsaved changes tracking
- ✅ All 13 form widget types implemented

## Integration Steps

### 1. Wrap your application with BlockEditProvider

The BlockEditProvider must wrap your block environment:

```tsx
import { BlockEnvironmentProvider } from "./context/block-environment-provider";
import { BlockEditProvider } from "./context/block-edit-provider";
import { BlockEditDrawer } from "./components/forms/block-edit-drawer";
import { EditModeIndicator } from "./components/forms/edit-mode-indicator";

function App() {
  return (
    <BlockEnvironmentProvider organisationId={orgId} initialTrees={trees}>
      <BlockEditProvider>
        {/* Your application content */}
        <YourBlockEditor />

        {/* Global components */}
        <BlockEditDrawer />
        <EditModeIndicator />
      </BlockEditProvider>
    </BlockEnvironmentProvider>
  );
}
```

### 2. BlockType Configuration

Ensure your BlockTypes have form configurations:

```typescript
const blockType: BlockType = {
  id: "...",
  key: "contact_block",
  name: "Contact",
  schema: {
    name: "Contact",
    type: "OBJECT",
    required: true,
    properties: {
      name: {
        name: "Name",
        type: "STRING",
        required: true,
      },
      email: {
        name: "Email",
        type: "STRING",
        format: "EMAIL",
        required: true,
      },
      phone: {
        name: "Phone",
        type: "STRING",
        format: "PHONE",
        required: false,
      },
    },
  },
  display: {
    form: {
      fields: {
        "data.name": {
          type: "TEXT_INPUT",
          label: "Full Name",
          description: "Enter the contact's full name",
          placeholder: "John Doe",
          required: true,
        },
        "data.email": {
          type: "EMAIL_INPUT",
          label: "Email Address",
          description: "Enter a valid email address",
          placeholder: "john@example.com",
          required: true,
        },
        "data.phone": {
          type: "PHONE_INPUT",
          label: "Phone Number",
          description: "Enter phone number with country code",
          placeholder: "+1 (555) 123-4567",
          required: false,
        },
      },
    },
    render: {
      // ... render configuration
    },
  },
};
```

### 3. PanelWrapper Integration

The PanelWrapper already includes edit functionality - no additional integration needed. It automatically:

- Detects Cmd+E and Cmd+Shift+E keyboard shortcuts
- Shows edit buttons in the toolbar
- Handles inline/drawer mode selection based on whether the block has children

## User Interactions

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+E` | Toggle inline edit for simple blocks, or open drawer for containers |
| `Cmd+Shift+E` | Always open drawer (even for simple blocks) |
| `Arrow Left/Right` | Navigate between toolbar buttons |
| `Enter` | Activate focused toolbar button |
| `Tab` | Navigate to next form field (or next block when at last field) |
| `Shift+Tab` | Navigate to previous form field (or previous block when at first field) |

### Toolbar Buttons

- **Edit Icon (✎)**: Toggles inline edit or opens drawer
  - Highlights in primary color when in edit mode
  - Shows "Save and exit" when active
  - For simple blocks: Opens inline edit (shows hint about Cmd+Shift+E for drawer)
  - For containers: Opens drawer with all children
  - **Accessible via arrow keys**: Navigate left/right between toolbar buttons, press Enter to activate

### Validation

- Validation occurs on blur for each field
- Errors display inline below each field
- Save operations are blocked if validation fails
- Drawer shows error count and highlights invalid blocks

## Form Widget Types

All 13 FormWidgetConfig types are supported:

1. **TEXT_INPUT** - Single-line text input
2. **NUMBER_INPUT** - Numeric input with validation
3. **EMAIL_INPUT** - Email with format validation
4. **PHONE_INPUT** - Phone number input
5. **TEXT_AREA** - Multi-line text input
6. **CURRENCY_INPUT** - Currency input with $ prefix
7. **CHECKBOX** - Boolean checkbox
8. **TOGGLE_SWITCH** - Boolean toggle switch
9. **RADIO_BUTTON** - Single selection from options
10. **DROPDOWN** - Single selection from searchable dropdown (uses Popover)
11. **DATE_PICKER** - Date selection with calendar popup
12. **SLIDER** - Numeric slider (0-100 range)
13. **FILE_UPLOAD** - File upload button

## Advanced Usage

### Programmatic Edit Control

You can programmatically control edit sessions:

```tsx
import { useBlockEdit } from "./context/block-edit-provider";

function MyComponent() {
  const { startEdit, saveEdit, openDrawer, isEditing } = useBlockEdit();

  // Start editing a block
  const handleEdit = () => {
    startEdit("block-id", "inline");
  };

  // Save changes
  const handleSave = async () => {
    const success = await saveEdit("block-id");
    if (success) {
      console.log("Saved!");
    }
  };

  // Open drawer for bulk editing
  const handleBulkEdit = () => {
    openDrawer("container-block-id");
  };

  return (
    <button onClick={handleEdit}>
      {isEditing("block-id") ? "Editing..." : "Edit"}
    </button>
  );
}
```

### Custom Validation

Validation is automatically handled based on BlockSchema, but you can also validate programmatically:

```tsx
const { validateBlock, validateField } = useBlockEdit();

// Validate a specific field
const errors = validateField("block-id", "data.email");
console.log(errors); // ["Invalid email format"]

// Validate entire block
const isValid = validateBlock("block-id");
```

### Draft State Management

Drafts are stored separately from the BlockEnvironment, so they persist during tree rebuilds:

```tsx
const { getDraft, updateDraft } = useBlockEdit();

// Get current draft
const draft = getDraft("block-id");

// Update a field in the draft
updateDraft("block-id", "data.email", "new-email@example.com");
```

## Focus Lock Integration

The edit system automatically acquires a focus lock when editing to:

- Prevent block movement during editing
- Show the EditModeIndicator banner
- Allow hover and selection (but blocks drag/drop)

## Error Handling

### Validation Errors

Validation errors are displayed:
- Inline below each form field
- In the drawer header (error count)
- With red border highlighting on invalid blocks

### Save Failures

If saving fails:
- The edit session remains active
- Validation errors are displayed
- User can fix issues and retry

## Best Practices

1. **Always define forms** for blocks that will be edited
2. **Use appropriate widget types** for better UX (e.g., EMAIL_INPUT for emails)
3. **Provide clear labels and descriptions** for form fields
4. **Set required fields** based on schema requirements
5. **Test validation rules** to ensure they match your data requirements
6. **Use drawer mode** for complex nested structures

## Troubleshooting

### Edit button not appearing
- Ensure BlockEditProvider wraps your component
- Check that the block has a form configuration in its BlockType

### Validation not working
- Verify BlockSchema matches form field paths
- Check that format types (EMAIL, PHONE, etc.) are set correctly in schema

### Drafts not persisting
- Ensure BlockEditProvider is at the correct level in component tree
- Verify draft state isn't being cleared unexpectedly

### Keyboard shortcuts not working
- Check that PanelWrapper is properly integrated
- Ensure no other components are capturing keyboard events
- Verify the block is selected (shortcuts only work on selected blocks)

## Future Enhancements

Potential improvements for future iterations:

- [ ] Undo/redo functionality
- [ ] Auto-save with debouncing
- [ ] Collaborative editing with conflict resolution
- [ ] Rich text editor widget
- [ ] Custom widget registration API
- [ ] Bulk operations in drawer (select multiple, delete multiple)
- [ ] Form field dependencies and conditional rendering
- [ ] File upload with actual server integration
