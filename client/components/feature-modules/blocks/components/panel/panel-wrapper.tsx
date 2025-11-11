"use client";
import { blockElements } from "@/components/feature-modules/blocks/util/block/block.registry";
import { ChildNodeProps, ClassNameProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { AnimatePresence } from "framer-motion";
import { TypeIcon } from "lucide-react";
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlockEdit } from "../../context/block-edit-provider";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useBlockFocus } from "../../context/block-focus-provider";
import { useFocusSurface } from "../../hooks/use-focus-surface";
import { isContentNode } from "../../interface/block.interface";
import { QuickActionItem, SlashMenuItem } from "../../interface/panel.interface";
import { BlockForm } from "../forms/block-form";
import InsertBlockModal from "../modals/insert-block-modal";
import QuickActionModal from "../modals/quick-action-modal";
import PanelActionContextMenu from "./action/panel-action-menu";
import PanelToolbar from "./toolbar/panel-toolbar";
import { useRenderElement } from "../../context/block-renderer-provider";

interface Props extends ChildNodeProps, ClassNameProps {
    id: string;
    title?: string;
    titlePlaceholder?: string;
    description?: string;
    display?: React.ReactNode;
    form?: React.ReactNode;
    slashItems?: SlashMenuItem[];
    quickActions?: QuickActionItem[];
    onTitleChange?: (value: string) => void;
    allowInsert?: boolean;
    onInsert?: (item: SlashMenuItem) => void;
    onInsertSibling?: (item: SlashMenuItem) => void;
    onDelete?: () => void;
}

export const defaultSlashItems: SlashMenuItem[] = Object.values(blockElements).map((meta) => ({
    id: meta.type,
    label: meta.name ?? meta.type,
    description: meta.description,
    icon: <TypeIcon className="size-4" />,
}));

export const PanelWrapper: FC<Props> = ({
    id,
    title,
    titlePlaceholder = "Untitled block",
    description,
    form,
    children,
    slashItems,
    quickActions,
    onTitleChange,
    onInsert,
    onInsertSibling,
    onDelete,
    className,
    allowInsert = false,
}) => {
    // todo: Move alot of this wrapper state into a context provider to reduce prop drilling

    const [isHovered, setIsHovered] = useState(false);
    const [isSlashOpen, setSlashOpen] = useState(false);
    const [isQuickOpen, setQuickOpen] = useState(false);
    const [isInlineMenuOpen, setInlineMenuOpen] = useState(false);
    const [isDetailsOpen, setDetailsOpen] = useState(false);
    const [isActionsOpen, setActionsOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState(title ?? "");
    const [insertContext, setInsertContext] = useState<"nested" | "sibling">("nested");
    const [toolbarFocusIndex, setToolbarFocusIndex] = useState<number>(-1); // -1 = no toolbar focus
    const inlineSearchRef = useRef<HTMLInputElement | null>(null);
    const surfaceRef = useRef<HTMLDivElement | null>(null);
    const actions = quickActions ?? [];

    // Block edit state
    const { startEdit, saveAndExit, openDrawer, isEditing, getEditMode, drawerState, cancelEdit } =
        useBlockEdit();
    const { getBlock, getChildren } = useBlockEnvironment();
    const [isEditMode, setEditMode] = useState(false);
    const block = getBlock(id);
    const hasChildren = getChildren(id).length > 0;

    // Get resize function for inline edit mode
    let requestResize: (() => void) | undefined;
    try {
        const renderContext = useRenderElement();
        requestResize = renderContext?.widget.requestResize;
    } catch {
        // Not in RenderElementProvider context, resize not available
        requestResize = undefined;
    }

    // Sync local edit mode state with provider
    useEffect(() => {
        const editMode = getEditMode(id);
        // Only set to true if in inline mode; drawer mode is handled separately
        setEditMode(editMode === "inline");
    }, [id, getEditMode]);

    const menuActions = useMemo(() => {
        if (onDelete && !actions.some((action) => action.id === "delete")) {
            return [
                ...actions,
                {
                    id: "__delete",
                    label: "Delete block",
                    onSelect: onDelete,
                },
            ];
        }
        return actions;
    }, [actions, onDelete]);

    const hasMenuActions = menuActions.length > 0;

    // Calculate toolbar button indices and count
    const toolbarIndices = useMemo(() => {
        let buttonIndex = 0;
        const quickActionsIndex = buttonIndex++;
        const insertIndex = allowInsert ? buttonIndex++ : -1;
        const editIndex = buttonIndex++; // Edit button always present
        const detailsIndex = buttonIndex++;
        const actionsMenuIndex = hasMenuActions ? buttonIndex++ : -1;
        return {
            quickActionsIndex,
            insertIndex,
            editIndex,
            detailsIndex,
            actionsMenuIndex,
            count: buttonIndex,
        };
    }, [allowInsert, hasMenuActions]);

    const {
        isSelected,
        focusSelf,
        setHovered: setFocusHover,
        disableHover,
        disableSelect,
    } = useFocusSurface({
        id,
        type: "panel",
        onDelete,
        elementRef: surfaceRef,
        focusParentOnDelete: true,
    });
    const { acquireLock } = useBlockFocus();
    const overlayLockRef = useRef<(() => void) | null>(null);

    const items = slashItems ?? defaultSlashItems;

    const shouldHighlight =
        isSelected ||
        isQuickOpen ||
        (allowInsert && (isInlineMenuOpen || isSlashOpen)) ||
        isHovered;

    // Close all menus when panel loses selection
    useEffect(() => {
        if (!isSelected) {
            setToolbarFocusIndex(-1);
            setSlashOpen(false);
            setQuickOpen(false);
            setInlineMenuOpen(false);
            setDetailsOpen(false);
            setActionsOpen(false);
        }
    }, [isSelected]);

    // Close menus when toolbar focus moves away from them (but keep panel selected)
    useEffect(() => {
        if (!isSelected) return; // Only applies when panel is selected
        if (toolbarFocusIndex === -1) return; // No keyboard focus, don't close menus

        const { quickActionsIndex, insertIndex, detailsIndex, actionsMenuIndex } = toolbarIndices;

        // Close menus that don't match the current toolbar focus
        if (toolbarFocusIndex !== quickActionsIndex && isQuickOpen) {
            setQuickOpen(false);
        }
        if (toolbarFocusIndex !== insertIndex && isInlineMenuOpen) {
            setInlineMenuOpen(false);
        }
        if (toolbarFocusIndex !== detailsIndex && isDetailsOpen) {
            setDetailsOpen(false);
        }
        if (toolbarFocusIndex !== actionsMenuIndex && isActionsOpen) {
            setActionsOpen(false);
        }
    }, [
        toolbarFocusIndex,
        isSelected,
        toolbarIndices,
        isQuickOpen,
        isInlineMenuOpen,
        isDetailsOpen,
        isActionsOpen,
    ]);

    useEffect(() => {
        const shouldLock =
            isSlashOpen ||
            isQuickOpen ||
            isInlineMenuOpen ||
            isDetailsOpen ||
            isActionsOpen ||
            drawerState.isOpen;
        // Acquire or release overlay lock based on menu state
        if (!shouldLock && overlayLockRef.current) {
            overlayLockRef.current();
            overlayLockRef.current = null;
        } else if (shouldLock && !overlayLockRef.current) {
            // Clear hover state before acquiring lock to prevent race condition
            setFocusHover(false);

            const release = acquireLock({
                id: `panel-overlay-${id}`,
                reason: "Panel overlay menu open",
                suppressHover: true,
                suppressSelection: true,
                suppressKeyboardNavigation: true, // Prevent block navigation when menus are open
                scope: "surface",
                surfaceId: id,
            });
            overlayLockRef.current = release;
        }

        return () => {
            if (overlayLockRef.current) {
                overlayLockRef.current();
                overlayLockRef.current = null;
            }
        };
    }, [
        id,
        acquireLock,
        isInlineMenuOpen,
        isQuickOpen,
        isSlashOpen,
        isDetailsOpen,
        isActionsOpen,
        drawerState.isOpen,
        setFocusHover,
    ]);

    useEffect(() => {
        setDraftTitle(title ?? "");
    }, [title]);

    useEffect(() => {
        if (isInlineMenuOpen) {
            requestAnimationFrame(() => inlineSearchRef.current?.focus());
        }
    }, [isInlineMenuOpen]);

    const handleEditClick = useCallback(() => {
        if (hasChildren) {
            // Has children: open drawer
            openDrawer(id);
        } else {
            // No children: toggle inline edit
            if (isEditMode) {
                saveAndExit(id).then((success) => {
                    if (success) {
                        setEditMode(false);
                        // Resize back to display content after exiting edit mode
                        if (requestResize) {
                            requestAnimationFrame(() => {
                                requestAnimationFrame(() => {
                                    requestResize();
                                });
                            });
                        }
                    }
                });
            } else {
                startEdit(id, "inline");
                setEditMode(true);
            }
        }
    }, [hasChildren, isEditMode, openDrawer, saveAndExit, startEdit, id, requestResize]);

    const handleSaveEditClick = useCallback(() => {
        if (isEditMode) {
            saveAndExit(id).then((success) => {
                if (success) {
                    setEditMode(false);
                    // Resize back to display content after saving
                    if (requestResize) {
                        requestAnimationFrame(() => {
                            requestAnimationFrame(() => {
                                requestResize();
                            });
                        });
                    }
                }
            });
        }
    }, [isEditMode, saveAndExit, id, requestResize]);

    const handleDiscardEditClick = useCallback(() => {
        if (isEditMode) {
            cancelEdit(id);
            setEditMode(false);
            // Resize back to display content after discarding
            if (requestResize) {
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        requestResize();
                    });
                });
            }
        }
    }, [isEditMode, cancelEdit, id, requestResize]);

    useEffect(() => {
        if (!isSelected) return;

        const handler = (event: KeyboardEvent) => {
            const active = document.activeElement;
            const isInput =
                active &&
                (active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA" ||
                    active.getAttribute("contenteditable") === "true");

            // Toolbar keyboard navigation
            // NOTE: Toolbar menus must use Popover, NOT DropdownMenu to avoid DOM focus conflicts.
            // See panel-toolbar.tsx and panel-actions.tsx for implementation details.

            // Toolbar navigation with Left/Right arrows
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                if (isInput) return;
                event.preventDefault();

                // Blur any focused toolbar button to prevent it from capturing Enter key
                const activeElement = document.activeElement as HTMLElement | null;
                if (activeElement && typeof activeElement.blur === "function") {
                    activeElement.blur();
                }

                if (toolbarFocusIndex === -1) {
                    // First time pressing arrow - focus first toolbar button
                    setToolbarFocusIndex(0);
                } else {
                    // Navigate between toolbar buttons
                    if (event.key === "ArrowLeft") {
                        setToolbarFocusIndex((prev) =>
                            prev <= 0 ? toolbarIndices.count - 1 : prev - 1
                        );
                    } else {
                        setToolbarFocusIndex((prev) =>
                            prev >= toolbarIndices.count - 1 ? 0 : prev + 1
                        );
                    }
                }
                return;
            }

            // Activate focused toolbar button with Enter
            if (event.key === "Enter" && toolbarFocusIndex >= 0) {
                if (isInput) return;
                event.preventDefault();

                const {
                    quickActionsIndex,
                    insertIndex,
                    editIndex,
                    detailsIndex,
                    actionsMenuIndex,
                } = toolbarIndices;

                // Handle edit button activation
                if (toolbarFocusIndex === editIndex) {
                    handleEditClick();
                    return;
                }

                // Handle other menu buttons
                setQuickOpen(toolbarFocusIndex === quickActionsIndex);
                setInlineMenuOpen(toolbarFocusIndex === insertIndex && insertIndex !== -1);
                setDetailsOpen(toolbarFocusIndex === detailsIndex);
                setActionsOpen(toolbarFocusIndex === actionsMenuIndex && actionsMenuIndex !== -1);

                return;
            }

            if (
                allowInsert &&
                event.key === "/" &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.altKey
            ) {
                if (isInput) return;
                event.preventDefault();
                setInsertContext("nested");
                focusSelf();
                setInlineMenuOpen(true);
            }

            // Cmd+E or Cmd+Shift+E: Edit mode
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
                event.preventDefault();

                if (event.shiftKey) {
                    // Cmd+Shift+E: Always open drawer for any block
                    openDrawer(id);
                } else {
                    // Cmd+E: Inline edit for simple blocks, drawer for containers
                    if (hasChildren) {
                        // Has children: open drawer
                        openDrawer(id);
                    } else {
                        // No children: toggle inline edit
                        if (isEditMode) {
                            // Exit edit mode and save
                            saveAndExit(id).then((success) => {
                                if (success) {
                                    setEditMode(false);
                                }
                            });
                        } else {
                            // Enter edit mode
                            startEdit(id, "inline");
                            setEditMode(true);
                        }
                    }
                }
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (allowInsert && actions.length === 0) {
                    setInsertContext("nested");
                    focusSelf();
                    setInlineMenuOpen(true);
                } else {
                    setQuickOpen(true);
                    focusSelf();
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [
        allowInsert,
        actions.length,
        focusSelf,
        isSelected,
        toolbarFocusIndex,
        toolbarIndices,
        hasMenuActions,
        isEditMode,
        hasChildren,
        openDrawer,
        saveAndExit,
        startEdit,
        id,
        handleEditClick,
    ]);

    const handleTitleBlur = useCallback(() => {
        if (draftTitle !== title) onTitleChange?.(draftTitle);
    }, [draftTitle, onTitleChange, title]);

    const handleOpenInsertModal = useCallback(() => {
        if (!allowInsert) return;
        setInlineMenuOpen(false);
        setSlashOpen(true);
        focusSelf();
    }, [allowInsert, focusSelf, setInlineMenuOpen, setSlashOpen]);

    const handleSelect = useCallback(
        (item: SlashMenuItem) => {
            if (!allowInsert) return;
            setInlineMenuOpen(false);
            setSlashOpen(false);
            item.onSelect?.();
            if (insertContext === "nested" && onInsert) {
                onInsert(item);
                return;
            }
            if (insertContext === "sibling" && onInsertSibling) {
                onInsertSibling(item);
                return;
            }
            if (onInsert) {
                onInsert(item);
            } else if (onInsertSibling) {
                onInsertSibling(item);
            }
        },
        [allowInsert, insertContext, onInsert, onInsertSibling, setInlineMenuOpen, setSlashOpen]
    );

    const handleQuickSelect = useCallback(
        (item: QuickActionItem) => {
            setQuickOpen(false);
            item.onSelect(id);
        },
        [id, setQuickOpen]
    );

    const handleMenuAction = useCallback(
        (item: QuickActionItem) => {
            item.onSelect(id);
        },
        [id]
    );

    const handleQuickActionsOpen = useCallback(() => {
        setToolbarFocusIndex(toolbarIndices.quickActionsIndex);
        setQuickOpen(true);
        focusSelf();
    }, [focusSelf, setQuickOpen, toolbarIndices.quickActionsIndex]);

    const handleInlineInsertOpen = useCallback(() => {
        if (!allowInsert) return;
        setToolbarFocusIndex(toolbarIndices.insertIndex);
        setInsertContext("nested");
        setInlineMenuOpen(true);
        focusSelf();
    }, [allowInsert, focusSelf, setInlineMenuOpen, toolbarIndices.insertIndex]);

    const handleQuickInsertOpenQuickActions = useCallback(() => {
        if (!allowInsert) return;
        setInlineMenuOpen(false);
        setQuickOpen(true);
        focusSelf();
    }, [allowInsert, focusSelf, setInlineMenuOpen, setQuickOpen]);

    const handleDetailsOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                setToolbarFocusIndex(toolbarIndices.detailsIndex);
            }
            setDetailsOpen(open);
        },
        [toolbarIndices.detailsIndex]
    );

    const handleActionsOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                setToolbarFocusIndex(toolbarIndices.actionsMenuIndex);
            }
            setActionsOpen(open);
        },
        [toolbarIndices.actionsMenuIndex]
    );

    const handleInlineMenuOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                setToolbarFocusIndex(toolbarIndices.insertIndex);
            }
            setInlineMenuOpen(open);
        },
        [toolbarIndices.insertIndex]
    );

    return (
        <>
            <PanelActionContextMenu id={id} actions={menuActions} onDelete={onDelete}>
                <div
                    ref={surfaceRef}
                    className={cn(
                        "group flex relative flex-col rounded-sm border text-card-foreground transition-colors w-full p-4",
                        allowInsert
                            ? shouldHighlight
                                ? "border-primary ring-2 ring-primary/30 bg-card shadow-sm"
                                : isHovered
                                ? "border-primary/40 bg-card/90 shadow-sm"
                                : "border-border bg-card/80 shadow-sm"
                            : shouldHighlight
                            ? "border-primary/70 bg-background/80"
                            : "border-border/50 bg-transparent",
                        className
                    )}
                    data-surface-id={id}
                    tabIndex={-1}
                    onPointerOver={(event) => {
                        if (disableHover) return;
                        const targetBlock = (event.target as HTMLElement | null)?.closest(
                            "[data-block-id]"
                        );
                        if (targetBlock) {
                            setIsHovered(false);
                            setFocusHover(false);
                            return;
                        }
                        const targetSurface = (event.target as HTMLElement | null)?.closest(
                            "[data-surface-id]"
                        );
                        if (!targetSurface || targetSurface === event.currentTarget) {
                            setIsHovered(true);
                            setFocusHover(true);
                        } else {
                            setIsHovered(false);
                            setFocusHover(false);
                        }
                    }}
                    onPointerLeave={() => {
                        setIsHovered(false);
                        setFocusHover(false);
                    }}
                    onPointerDown={(event) => {
                        if (disableSelect) return;
                        // If the pointer interaction is happening inside another block surface,
                        // let the child handle its own activation.
                        const targetBlock = (event.target as HTMLElement | null)?.closest(
                            "[data-block-id]"
                        );
                        if (targetBlock) return;
                        const targetSurface = (event.target as HTMLElement | null)?.closest(
                            "[data-surface-id]"
                        ) as HTMLElement | null;
                        if (targetSurface && targetSurface !== event.currentTarget) return;
                        focusSelf();
                    }}
                    onFocusCapture={() => {
                        focusSelf();
                    }}
                >
                    <AnimatePresence key={`panel-toolbar-${id}`}>
                        {shouldHighlight && (
                            <PanelToolbar
                                visible={shouldHighlight}
                                onQuickActionsClick={handleQuickActionsOpen}
                                allowInsert={allowInsert}
                                onInlineInsertClick={
                                    allowInsert ? handleInlineInsertOpen : undefined
                                }
                                inlineMenuOpen={allowInsert ? isInlineMenuOpen : undefined}
                                onInlineMenuOpenChange={
                                    allowInsert ? handleInlineMenuOpenChange : undefined
                                }
                                inlineSearchRef={allowInsert ? inlineSearchRef : undefined}
                                items={allowInsert ? items : undefined}
                                onSelectItem={allowInsert ? handleSelect : undefined}
                                onShowAllOptions={allowInsert ? handleOpenInsertModal : undefined}
                                onOpenQuickActionsFromInline={
                                    allowInsert ? handleQuickInsertOpenQuickActions : undefined
                                }
                                draftTitle={draftTitle}
                                onDraftTitleChange={(value) => setDraftTitle(value)}
                                onTitleBlur={handleTitleBlur}
                                titlePlaceholder={titlePlaceholder}
                                description={description}
                                hasMenuActions={hasMenuActions}
                                menuActions={menuActions}
                                onMenuAction={handleMenuAction}
                                toolbarFocusIndex={toolbarFocusIndex}
                                detailsOpen={isDetailsOpen}
                                onDetailsOpenChange={handleDetailsOpenChange}
                                actionsOpen={isActionsOpen}
                                onActionsOpenChange={handleActionsOpenChange}
                                onEditClick={handleEditClick}
                                isEditMode={isEditMode}
                                hasChildren={hasChildren}
                                onSaveEditClick={handleSaveEditClick}
                                onDiscardEditClick={handleDiscardEditClick}
                            />
                        )}
                    </AnimatePresence>
                    {isEditMode && block && isContentNode(block) ? (
                        <BlockForm
                            blockId={id}
                            blockType={block.block.type}
                            mode="inline"
                            onResize={requestResize}
                        />
                    ) : (
                        children
                    )}
                    {allowInsert && (
                        <InsertBlockModal
                            open={isSlashOpen}
                            onOpenChange={setSlashOpen}
                            onSelect={handleSelect}
                            items={items}
                        />
                    )}
                </div>
            </PanelActionContextMenu>
            <QuickActionModal
                open={isQuickOpen}
                setOpen={setQuickOpen}
                onInsert={allowInsert ? handleOpenInsertModal : undefined}
                onActionSelect={handleQuickSelect}
                actions={actions}
                allowInsert={allowInsert}
            />
        </>
    );
};

PanelWrapper.displayName = "PanelWrapper";
