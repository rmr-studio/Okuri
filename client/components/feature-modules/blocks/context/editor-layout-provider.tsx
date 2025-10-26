/**
 * Editor Layout Provider
 *
 * Tracks the real-time hierarchical structure of blocks in the editor based
 * on their actual GridStack positions. This ensures that deletion operations only
 * affect blocks that are genuinely nested at the time of deletion, not blocks
 * that have been moved elsewhere.
 */
"use client";

import { GridStack } from "gridstack";
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

/**
 * Represents the hierarchical layout structure of the editor.
 * Maps each block ID to its parent block ID (or null if top-level).
 */
export type EditorHierarchy = Map<string, string | null>;

/**
 * Layout context value providing hierarchy queries and updates.
 */
interface EditorLayoutContextValue {
    /** Current hierarchy map: blockId -> parentId | null */
    hierarchy: EditorHierarchy;

    /** Get the parent ID of a block, or null if it's top-level */
    getParent(blockId: string): string | null;

    /** Get all direct children of a block */
    getChildren(blockId: string): string[];

    /** Get all descendants (recursive) of a block */
    getDescendants(blockId: string): string[];

    /** Check if blockId is a descendant of potentialAncestor */
    isDescendantOf(blockId: string, potentialAncestor: string): boolean;

    /** Manually update the hierarchy (for programmatic changes) */
    updateHierarchy(updates: Array<{ blockId: string; parentId: string | null }>): void;

    /** Register a GridStack instance to track its layout changes */
    registerGrid(grid: GridStack, parentId: string | null): void;

    /** Unregister a GridStack instance */
    unregisterGrid(grid: GridStack): void;

    /** Remove a block and all its descendants from the hierarchy */
    removeBlock(blockId: string): void;
}

const EditorLayoutContext = createContext<EditorLayoutContextValue | null>(null);

interface Props {
    children: React.ReactNode;
    /** Initial hierarchy state (optional) */
    initialHierarchy?: EditorHierarchy;
}

/**
 * Provider that maintains the real-time layout hierarchy of blocks.
 *
 * This component tracks which blocks are nested within which parents by
 * monitoring GridStack DOM structure and events. It provides a source of
 * truth for the current layout that deletion operations can consult.
 */
export const EditorLayoutProvider: React.FC<Props> = ({ children, initialHierarchy }) => {
    const [hierarchy, setHierarchy] = useState<EditorHierarchy>(initialHierarchy ?? new Map());

    // Track registered GridStack instances and their parent blocks
    const gridRegistry = useRef<Map<GridStack, string | null>>(new Map());

    const getParent = useCallback(
        (blockId: string): string | null => {
            return hierarchy.get(blockId) ?? null;
        },
        [hierarchy]
    );

    const getChildren = useCallback(
        (blockId: string): string[] => {
            const children: string[] = [];
            hierarchy.forEach((parentId, childId) => {
                if (parentId === blockId) {
                    children.push(childId);
                }
            });
            return children;
        },
        [hierarchy]
    );

    const getDescendants = useCallback(
        (blockId: string): string[] => {
            const descendants: string[] = [];
            const queue = [blockId];

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                hierarchy.forEach((parentId, childId) => {
                    if (parentId === currentId) {
                        descendants.push(childId);
                        queue.push(childId);
                    }
                });
            }

            return descendants;
        },
        [hierarchy]
    );

    const isDescendantOf = useCallback(
        (blockId: string, potentialAncestor: string): boolean => {
            let current = blockId;
            while (current) {
                const parent = hierarchy.get(current);
                if (parent === potentialAncestor) return true;
                if (!parent) break;
                current = parent;
            }
            return false;
        },
        [hierarchy]
    );

    const updateHierarchy = useCallback(
        (updates: Array<{ blockId: string; parentId: string | null }>) => {
            console.log("[EditorLayoutProvider] Updating hierarchy:", updates);
            setHierarchy((prev) => {
                const next = new Map(prev);
                updates.forEach(({ blockId, parentId }) => {
                    const oldParent = prev.get(blockId);
                    if (parentId === null) {
                        next.set(blockId, null);
                    } else {
                        next.set(blockId, parentId);
                    }
                    console.log(`[EditorLayoutProvider] Block ${blockId}: ${oldParent} -> ${parentId}`);
                });
                return next;
            });
        },
        []
    );

    const removeBlock = useCallback((blockId: string) => {
        setHierarchy((prev) => {
            const next = new Map(prev);

            // Remove the block itself
            next.delete(blockId);

            // Remove all descendants
            const descendants: string[] = [];
            const queue = [blockId];

            while (queue.length > 0) {
                const currentId = queue.shift()!;
                prev.forEach((parentId, childId) => {
                    if (parentId === currentId) {
                        descendants.push(childId);
                        queue.push(childId);
                    }
                });
            }

            descendants.forEach((descendantId) => next.delete(descendantId));

            return next;
        });
    }, []);

    const registerGrid = useCallback(
        (grid: GridStack, parentId: string | null) => {
            gridRegistry.current.set(grid, parentId);

            // Scan existing widgets in this grid and update hierarchy
            const widgets = grid.getGridItems();
            const updates: Array<{ blockId: string; parentId: string | null }> = [];

            widgets.forEach((element) => {
                const widgetId = element.getAttribute("gs-id");
                if (widgetId) {
                    updates.push({ blockId: widgetId, parentId });
                }
            });

            if (updates.length > 0) {
                updateHierarchy(updates);
            }

            // Listen to GridStack events
            const handleAdded = (event: Event, items: any[]) => {
                if (!items || items.length === 0) return;

                const updates: Array<{ blockId: string; parentId: string | null }> = [];
                items.forEach((item) => {
                    if (item.id) {
                        updates.push({ blockId: item.id, parentId });
                    }
                });

                if (updates.length > 0) {
                    updateHierarchy(updates);
                }
            };

            const handleRemoved = (event: Event, items: any[]) => {
                if (!items || items.length === 0) return;

                // When a widget is removed from a grid, check if it was moved to another grid
                // or if it was actually deleted. For now, we don't remove from hierarchy
                // because it might be moving to another grid. The actual deletion will be
                // handled by the removeBlock method when the block is truly deleted.
            };

            const handleDropped = (event: Event, previousWidget: any, newWidget: any) => {
                // Handle cross-grid moves
                if (newWidget?.id) {
                    const targetGrid = newWidget.grid;
                    const targetParentId = gridRegistry.current.get(targetGrid) ?? null;
                    updateHierarchy([{ blockId: newWidget.id, parentId: targetParentId }]);
                }
            };

            const handleChange = (_event: Event, items: any[]) => {
                // Handle widget moves within or between grids
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

            grid.on("added", handleAdded);
            grid.on("removed", handleRemoved);
            grid.on("dropped", handleDropped);
            grid.on("change", handleChange);

            // Store cleanup functions
            const cleanup = () => {
                grid.off("added");
                grid.off("removed");
                grid.off("dropped");
                grid.off("change");
                gridRegistry.current.delete(grid);
            };

            // Store cleanup for later
            (grid as any).__editorLayoutCleanup = cleanup;
        },
        [updateHierarchy]
    );

    const unregisterGrid = useCallback((grid: GridStack) => {
        const cleanup = (grid as any).__editorLayoutCleanup;
        if (cleanup && typeof cleanup === "function") {
            cleanup();
        }
        gridRegistry.current.delete(grid);
    }, []);

    const value = useMemo<EditorLayoutContextValue>(
        () => ({
            hierarchy,
            getParent,
            getChildren,
            getDescendants,
            isDescendantOf,
            updateHierarchy,
            registerGrid,
            unregisterGrid,
            removeBlock,
        }),
        [
            hierarchy,
            getParent,
            getChildren,
            getDescendants,
            isDescendantOf,
            updateHierarchy,
            registerGrid,
            unregisterGrid,
            removeBlock,
        ]
    );

    return <EditorLayoutContext.Provider value={value}>{children}</EditorLayoutContext.Provider>;
};

/**
 * Hook to access the editor layout context.
 *
 * @throws Error if used outside of EditorLayoutProvider
 */
export function useEditorLayout(): EditorLayoutContextValue {
    const context = useContext(EditorLayoutContext);
    if (!context) {
        throw new Error("useEditorLayout must be used within an EditorLayoutProvider");
    }
    return context;
}
