/**
 * Complete Example: Block Editing System Integration
 *
 * This example shows how to integrate the block editing system into your application.
 */

import React from "react";
import { BlockEnvironmentProvider } from "./context/block-environment-provider";
import { BlockEditProvider } from "./context/block-edit-provider";
import { BlockFocusProvider } from "./context/block-focus-provider";
import { BlockEditDrawer } from "./components/forms/block-edit-drawer";
import { EditModeIndicator } from "./components/forms/edit-mode-indicator";
import { BlockTree, BlockType } from "./interface/block.interface";

/**
 * Example 1: Basic Integration
 *
 * Wrap your block editor with the required providers
 */
export function BasicIntegrationExample() {
    const organisationId = "your-org-id";
    const initialTrees: BlockTree[] = []; // Your initial block trees

    return (
        <BlockEnvironmentProvider organisationId={organisationId} initialTrees={initialTrees}>
            <BlockFocusProvider>
                <BlockEditProvider>
                    {/* Your block editor UI */}
                    <YourBlockEditor />

                    {/* Global components - must be inside BlockEditProvider */}
                    <BlockEditDrawer />
                    <EditModeIndicator />
                </BlockEditProvider>
            </BlockFocusProvider>
        </BlockEnvironmentProvider>
    );
}

/**
 * Example 2: Creating a Block Type with Form Configuration
 */
export const exampleContactBlockType: BlockType = {
    id: "contact-block-type-id",
    key: "contact_card",
    version: 1,
    name: "Contact Card",
    description: "A card displaying contact information",
    organisationId: "org-id",
    archived: false,
    strictness: "STRICT",
    system: false,

    // Schema defines data structure and validation rules
    schema: {
        name: "Contact",
        type: "OBJECT",
        required: true,
        properties: {
            name: {
                name: "Full Name",
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
            notes: {
                name: "Notes",
                type: "STRING",
                required: false,
            },
            isActive: {
                name: "Active",
                type: "BOOLEAN",
                required: false,
            },
        },
    },

    // Display configuration includes both form and render structures
    display: {
        // Form configuration for editing
        form: {
            fields: {
                "data.name": {
                    type: "TEXT_INPUT",
                    label: "Full Name",
                    description: "Enter the contact's full name",
                    placeholder: "John Doe",
                },
                "data.email": {
                    type: "EMAIL_INPUT",
                    label: "Email Address",
                    description: "Primary email address",
                    placeholder: "john.doe@example.com",
                },
                "data.phone": {
                    type: "PHONE_INPUT",
                    label: "Phone Number",
                    description: "Include country code",
                    placeholder: "+1 (555) 123-4567",
                },
                "data.notes": {
                    type: "TEXT_AREA",
                    label: "Notes",
                    description: "Additional information about this contact",
                    placeholder: "Enter any notes...",
                },
                "data.isActive": {
                    type: "TOGGLE_SWITCH",
                    label: "Active Contact",
                    description: "Is this contact currently active?",
                },
            },
        },

        // Render configuration for display mode
        render: {
            version: 1,
            layoutGrid: {
                layout: { x: 0, y: 0, width: 12, height: 6, locked: false },
                items: [
                    { id: "name-text", rect: { x: 0, y: 0, width: 12, height: 1, locked: false } },
                    {
                        id: "email-text",
                        rect: { x: 0, y: 1, width: 12, height: 1, locked: false },
                    },
                ],
            },
            components: {
                "name-text": {
                    id: "name-text",
                    type: "TEXT",
                    props: {},
                    bindings: [
                        {
                            prop: "content",
                            source: { type: "DataPath", path: "$.data.name" },
                        },
                    ],
                    fetchPolicy: "INHERIT",
                },
                "email-text": {
                    id: "email-text",
                    type: "TEXT",
                    props: {},
                    bindings: [
                        {
                            prop: "content",
                            source: { type: "DataPath", path: "$.data.email" },
                        },
                    ],
                    fetchPolicy: "INHERIT",
                },
            },
        },
    },
};

/**
 * Example 3: Using Edit Functions Programmatically
 */
export function ProgrammaticEditExample() {
    const { startEdit, saveEdit, openDrawer, isEditing, hasUnsavedChanges } = useBlockEdit();

    const handleStartInlineEdit = (blockId: string) => {
        startEdit(blockId, "inline");
    };

    const handleSaveChanges = async (blockId: string) => {
        const success = await saveEdit(blockId);
        if (success) {
            console.log("Changes saved successfully");
        } else {
            console.log("Validation failed or error occurred");
        }
    };

    const handleOpenDrawer = (containerBlockId: string) => {
        openDrawer(containerBlockId);
    };

    return (
        <div>
            <button onClick={() => handleStartInlineEdit("block-1")}>Edit Block</button>
            <button onClick={() => handleSaveChanges("block-1")}>Save Changes</button>
            <button onClick={() => handleOpenDrawer("container-1")}>Edit Container</button>

            {hasUnsavedChanges() && <div className="warning">You have unsaved changes!</div>}
        </div>
    );
}

/**
 * Example 4: Custom Form Widget Usage
 */
export function CustomFormWidgetExample() {
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState<string[]>([]);

    const validateEmail = (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            setErrors(["Invalid email format"]);
        } else {
            setErrors([]);
        }
    };

    return (
        <EmailInputWidget
            value={email}
            onChange={setEmail}
            onBlur={() => validateEmail(email)}
            label="Email Address"
            description="Enter a valid email"
            placeholder="user@example.com"
            errors={errors}
        />
    );
}

/**
 * Example 5: Container Block with Nested Children
 */
export function ContainerBlockExample() {
    // When a container block has children, pressing Cmd+E opens the drawer
    // The drawer shows:
    // 1. Form for the container itself (if it has data)
    // 2. Collapsible sections for each child
    // 3. Recursive forms for nested children

    return (
        <div className="explanation">
            <h3>Editing Container Blocks</h3>
            <ul>
                <li>
                    <strong>Cmd+E on container:</strong> Opens drawer with all children
                </li>
                <li>
                    <strong>Cmd+Shift+E on any block:</strong> Always opens drawer
                </li>
                <li>
                    <strong>Drawer features:</strong>
                    <ul>
                        <li>Recursive form rendering for nested blocks</li>
                        <li>Collapsible sections for each child</li>
                        <li>Validation before saving all changes</li>
                        <li>Error highlighting for invalid blocks</li>
                    </ul>
                </li>
            </ul>
        </div>
    );
}

/**
 * Example 6: Form Widget Types Reference
 */
export const FormWidgetTypesReference = {
    // Text inputs
    TEXT_INPUT: { defaultValue: "", description: "Single-line text" },
    TEXT_AREA: { defaultValue: "", description: "Multi-line text" },
    EMAIL_INPUT: { defaultValue: "", description: "Email with validation" },
    PHONE_INPUT: { defaultValue: "", description: "Phone number" },

    // Numeric inputs
    NUMBER_INPUT: { defaultValue: 0, description: "Numeric input" },
    CURRENCY_INPUT: { defaultValue: 0, description: "Currency with $ prefix" },
    SLIDER: { defaultValue: 0, description: "Numeric slider (0-100)" },

    // Boolean inputs
    CHECKBOX: { defaultValue: false, description: "Checkbox" },
    TOGGLE_SWITCH: { defaultValue: false, description: "Toggle switch" },

    // Selection inputs
    RADIO_BUTTON: {
        defaultValue: "",
        description: "Radio buttons",
        requiresOptions: true,
    },
    DROPDOWN: {
        defaultValue: "",
        description: "Searchable dropdown (Popover)",
        requiresOptions: true,
    },

    // Special inputs
    DATE_PICKER: { defaultValue: "", description: "Date picker with calendar" },
    FILE_UPLOAD: { defaultValue: "", description: "File upload button" },
};

/**
 * Placeholder component for demonstration
 */
function YourBlockEditor() {
    return <div>Your block editor implementation</div>;
}

/**
 * Placeholder hook for demonstration
 */
function useBlockEdit() {
    // This would import from the actual hook
    return {
        startEdit: (id: string, mode: "inline" | "drawer") => {},
        saveEdit: async (id: string) => true,
        openDrawer: (id: string) => {},
        isEditing: (id: string) => false,
        hasUnsavedChanges: () => false,
    };
}

/**
 * Placeholder widget for demonstration
 */
function EmailInputWidget(props: any) {
    return null;
}

const useState = (initial: any) => [initial, (v: any) => {}];
