"use client";

import { get, set } from "@/lib/util/utils";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { BlockNode, isContentNode } from "../interface/block.interface";
import { useBlockEnvironment } from "./block-environment-provider";
import { useBlockFocus } from "./block-focus-provider";

/* -------------------------------------------------------------------------- */
/*                              Type Definitions                              */
/* -------------------------------------------------------------------------- */

export interface EditSession {
    blockId: string;
    mode: "inline" | "drawer";
    startedAt: Date;
    isDirty: boolean;
    validationErrors: Map<string, string[]>; // field path -> errors
}

export interface DrawerState {
    isOpen: boolean;
    rootBlockId: string | null;
    expandedSections: Set<string>; // for accordion
}

export interface BlockEditContextValue {
    // State
    editingSessions: Map<string, EditSession>;
    drafts: Map<string, any>; // blockId -> draft payload data
    drawerState: DrawerState;

    // Block-level actions
    startEdit(blockId: string, mode: "inline" | "drawer"): void;
    saveEdit(blockId: string): Promise<boolean>;
    cancelEdit(blockId: string): void;
    saveAndExit(blockId: string): Promise<boolean>;

    // Draft manipulation
    updateDraft(blockId: string, fieldPath: string, value: any): void;
    getDraft(blockId: string): any | null;

    // Drawer management
    openDrawer(rootBlockId: string): void;
    closeDrawer(saveAll: boolean): Promise<void>;
    toggleSection(blockId: string): void;

    // Validation
    validateField(blockId: string, fieldPath: string): string[];
    validateBlock(blockId: string): boolean;
    getFieldErrors(blockId: string, fieldPath: string): string[];

    // Queries
    isEditing(blockId: string): boolean;
    getEditMode(blockId: string): "inline" | "drawer" | null;
    hasUnsavedChanges(): boolean;
    getEditingCount(): number;
}

/* -------------------------------------------------------------------------- */
/*                                   Context                                  */
/* -------------------------------------------------------------------------- */

export const BlockEditContext = createContext<BlockEditContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/*                                   Provider                                 */
/* -------------------------------------------------------------------------- */

export const BlockEditProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [editingSessions, setEditingSessions] = useState<Map<string, EditSession>>(new Map());
    const [drafts, setDrafts] = useState<Map<string, any>>(new Map());
    const [drawerState, setDrawerState] = useState<DrawerState>({
        isOpen: false,
        rootBlockId: null,
        expandedSections: new Set(),
    });

    const { getBlock, updateBlock } = useBlockEnvironment();
    const { acquireLock } = useBlockFocus();
    const lockRef = useRef<(() => void) | null>(null);

    /* -------------------------------------------------------------------------- */
    /*                              Focus Lock Management                         */
    /* -------------------------------------------------------------------------- */

    useEffect(() => {
        const hasActiveEdits = editingSessions.size > 0 || drawerState.isOpen;

        if (hasActiveEdits && !lockRef.current) {
            const release = acquireLock({
                id: "block-edit-session",
                reason: "Editing blocks - movement disabled",
                suppressHover: false, // Allow hover
                suppressSelection: false, // Allow selection
                suppressKeyboardNavigation: false, // Allow tab between fields
                scope: "global",
            });
            lockRef.current = release;
        } else if (!hasActiveEdits && lockRef.current) {
            lockRef.current();
            lockRef.current = null;
        }

        return () => {
            if (lockRef.current) {
                lockRef.current();
                lockRef.current = null;
            }
        };
    }, [editingSessions.size, drawerState.isOpen, acquireLock]);

    /* -------------------------------------------------------------------------- */
    /*                              Block-level Actions                           */
    /* -------------------------------------------------------------------------- */

    const startEdit = useCallback(
        (blockId: string, mode: "inline" | "drawer") => {
            const block = getBlock(blockId);
            if (!block || !isContentNode(block)) {
                console.warn(`Cannot start edit: block ${blockId} not found or not a content node`);
                return;
            }

            // Clone current block payload data into drafts
            const currentData = block.block.payload;
            const draftData = structuredClone(currentData);

            setDrafts((prev) => {
                const next = new Map(prev);
                next.set(blockId, draftData);
                return next;
            });

            setEditingSessions((prev) => {
                const next = new Map(prev);
                next.set(blockId, {
                    blockId,
                    mode,
                    startedAt: new Date(),
                    isDirty: false,
                    validationErrors: new Map(),
                });
                return next;
            });

            console.log(`Started ${mode} edit for block ${blockId}`);
        },
        [getBlock]
    );

    const validateBlock = useCallback(
        (blockId: string): boolean => {
            const session = editingSessions.get(blockId);
            if (!session) return true;

            const block = getBlock(blockId);
            if (!block || !isContentNode(block)) return false;

            const formFields = block.block.type.display.form.fields;
            let isValid = true;

            // Validate all fields
            Object.keys(formFields).forEach((fieldPath) => {
                const errors = validateField(blockId, fieldPath);
                if (errors.length > 0) {
                    isValid = false;
                }
            });

            return isValid;
        },
        [editingSessions, getBlock]
    );

    const saveEdit = useCallback(
        async (blockId: string): Promise<boolean> => {
            const session = editingSessions.get(blockId);
            if (!session) {
                console.warn(`No edit session found for block ${blockId}`);
                return false;
            }

            // Validate before saving
            if (!validateBlock(blockId)) {
                console.warn(`Validation failed for block ${blockId}. Cannot save.`);
                return false;
            }

            const draft = drafts.get(blockId);
            if (!draft) {
                console.warn(`No draft found for block ${blockId}`);
                return false;
            }

            const block = getBlock(blockId);
            if (!block || !isContentNode(block)) {
                console.warn(`Block ${blockId} not found or not a content node`);
                return false;
            }

            // Create updated node with draft data
            const updatedNode: BlockNode = {
                ...block,
                block: {
                    ...block.block,
                    payload: draft,
                },
            };

            // Commit to BlockEnvironment
            updateBlock(blockId, updatedNode);

            // Clean up session and draft
            setEditingSessions((prev) => {
                const next = new Map(prev);
                next.delete(blockId);
                return next;
            });

            setDrafts((prev) => {
                const next = new Map(prev);
                next.delete(blockId);
                return next;
            });

            console.log(`Saved block ${blockId}`);
            return true;
        },
        [editingSessions, drafts, getBlock, updateBlock, validateBlock]
    );

    const cancelEdit = useCallback((blockId: string) => {
        setEditingSessions((prev) => {
            const next = new Map(prev);
            next.delete(blockId);
            return next;
        });

        setDrafts((prev) => {
            const next = new Map(prev);
            next.delete(blockId);
            return next;
        });

        console.log(`Cancelled edit for block ${blockId}`);
    }, []);

    const saveAndExit = useCallback(
        async (blockId: string): Promise<boolean> => {
            const success = await saveEdit(blockId);
            return success;
        },
        [saveEdit]
    );

    /* -------------------------------------------------------------------------- */
    /*                              Draft Manipulation                            */
    /* -------------------------------------------------------------------------- */

    const updateDraft = useCallback((blockId: string, fieldPath: string, value: any) => {
        setDrafts((prev) => {
            const next = new Map(prev);
            const draft = next.get(blockId);
            if (!draft) {
                console.warn(`No draft found for block ${blockId}`);
                return prev;
            }

            // Use lodash set for nested paths
            const updated = structuredClone(draft);
            set(updated, fieldPath, value);
            next.set(blockId, updated);
            return next;
        });

        // Mark session as dirty
        setEditingSessions((prev) => {
            const next = new Map(prev);
            const session = next.get(blockId);
            if (session) {
                session.isDirty = true;
            }
            return next;
        });
    }, []);

    const getDraft = useCallback(
        (blockId: string): any | null => {
            return drafts.get(blockId) || null;
        },
        [drafts]
    );

    /* -------------------------------------------------------------------------- */
    /*                              Drawer Management                             */
    /* -------------------------------------------------------------------------- */

    const openDrawer = useCallback(
        (rootBlockId: string) => {
            const block = getBlock(rootBlockId);
            if (!block) {
                console.warn(`Cannot open drawer: block ${rootBlockId} not found`);
                return;
            }

            // Start edit session for drawer mode
            startEdit(rootBlockId, "drawer");

            setDrawerState({
                isOpen: true,
                rootBlockId,
                expandedSections: new Set([rootBlockId]), // Expand root by default
            });

            console.log(`Opened drawer for block ${rootBlockId}`);
        },
        [getBlock, startEdit]
    );

    const closeDrawer = useCallback(
        async (saveAll: boolean) => {
            if (!drawerState.rootBlockId) return;

            if (saveAll) {
                // Collect all blocks in drawer that are being edited
                const blocksToSave = Array.from(editingSessions.keys()).filter(
                    (blockId) => editingSessions.get(blockId)?.mode === "drawer"
                );

                // Validate all blocks first
                const allValid = blocksToSave.every((blockId) => validateBlock(blockId));

                if (!allValid) {
                    console.warn("Validation failed for one or more blocks. Cannot save.");
                    return;
                }

                // Save all blocks
                for (const blockId of blocksToSave) {
                    await saveEdit(blockId);
                }
            } else {
                // Cancel all drawer sessions
                const blocksToCancel = Array.from(editingSessions.keys()).filter(
                    (blockId) => editingSessions.get(blockId)?.mode === "drawer"
                );

                blocksToCancel.forEach((blockId) => cancelEdit(blockId));
            }

            setDrawerState({
                isOpen: false,
                rootBlockId: null,
                expandedSections: new Set(),
            });

            console.log(`Closed drawer (saved: ${saveAll})`);
        },
        [drawerState.rootBlockId, editingSessions, validateBlock, saveEdit, cancelEdit]
    );

    const toggleSection = useCallback((blockId: string) => {
        setDrawerState((prev) => {
            const expanded = new Set(prev.expandedSections);
            if (expanded.has(blockId)) {
                expanded.delete(blockId);
            } else {
                expanded.add(blockId);
            }
            return {
                ...prev,
                expandedSections: expanded,
            };
        });
    }, []);

    /* -------------------------------------------------------------------------- */
    /*                                 Validation                                 */
    /* -------------------------------------------------------------------------- */

    const validateField = useCallback(
        (blockId: string, fieldPath: string): string[] => {
            const block = getBlock(blockId);
            if (!block || !isContentNode(block)) return [];

            const draft = drafts.get(blockId);
            if (!draft) return [];

            const value = get(draft, fieldPath);
            const schema = block.block.type.schema;
            const formField = block.block.type.display.form.fields[fieldPath];

            const errors: string[] = [];

            // Check required
            if (formField && schema.required) {
                if (value === undefined || value === null || value === "") {
                    errors.push("This field is required");
                }
            }

            // Type-specific validation based on schema format
            if (value && schema.format) {
                switch (schema.format) {
                    case "EMAIL":
                        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                            errors.push("Invalid email format");
                        }
                        break;
                    case "PHONE":
                        if (!/^\+?[\d\s\-()]+$/.test(value)) {
                            errors.push("Invalid phone format");
                        }
                        break;
                    case "URL":
                        try {
                            new URL(value);
                        } catch {
                            errors.push("Invalid URL format");
                        }
                        break;
                }
            }

            // Update session validation errors
            setEditingSessions((prev) => {
                const next = new Map(prev);
                const session = next.get(blockId);
                if (session) {
                    session.validationErrors.set(fieldPath, errors);
                }
                return next;
            });

            return errors;
        },
        [getBlock, drafts]
    );

    const getFieldErrors = useCallback(
        (blockId: string, fieldPath: string): string[] => {
            const session = editingSessions.get(blockId);
            if (!session) return [];
            return session.validationErrors.get(fieldPath) || [];
        },
        [editingSessions]
    );

    /* -------------------------------------------------------------------------- */
    /*                                   Queries                                  */
    /* -------------------------------------------------------------------------- */

    const isEditing = useCallback(
        (blockId: string): boolean => {
            return editingSessions.has(blockId);
        },
        [editingSessions]
    );

    const getEditMode = useCallback(
        (blockId: string): "inline" | "drawer" | null => {
            const session = editingSessions.get(blockId);
            return session?.mode || null;
        },
        [editingSessions]
    );

    const hasUnsavedChanges = useCallback((): boolean => {
        return Array.from(editingSessions.values()).some((session) => session.isDirty);
    }, [editingSessions]);

    const getEditingCount = useCallback((): number => {
        return editingSessions.size;
    }, [editingSessions]);

    /* -------------------------------------------------------------------------- */
    /*                                Context Value                               */
    /* -------------------------------------------------------------------------- */

    const value = useMemo<BlockEditContextValue>(
        () => ({
            editingSessions,
            drafts,
            drawerState,
            startEdit,
            saveEdit,
            cancelEdit,
            saveAndExit,
            updateDraft,
            getDraft,
            openDrawer,
            closeDrawer,
            toggleSection,
            validateField,
            validateBlock,
            getFieldErrors,
            isEditing,
            getEditMode,
            hasUnsavedChanges,
            getEditingCount,
        }),
        [
            editingSessions,
            drafts,
            drawerState,
            startEdit,
            saveEdit,
            cancelEdit,
            saveAndExit,
            updateDraft,
            getDraft,
            openDrawer,
            closeDrawer,
            toggleSection,
            validateField,
            validateBlock,
            getFieldErrors,
            isEditing,
            getEditMode,
            hasUnsavedChanges,
            getEditingCount,
        ]
    );

    return <BlockEditContext.Provider value={value}>{children}</BlockEditContext.Provider>;
};

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export const useBlockEdit = (): BlockEditContextValue => {
    const context = useContext(BlockEditContext);
    if (!context) {
        throw new Error("useBlockEdit must be used within BlockEditProvider");
    }
    return context;
};
