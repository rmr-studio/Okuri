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
import { useLayoutChange } from "../../context/layout-change-provider";
import { useRenderElement } from "../../context/block-renderer-provider";
import { useFocusSurface } from "../../hooks/use-focus-surface";
import { isContentNode } from "../../interface/block.interface";
import { QuickActionItem, SlashMenuItem } from "../../interface/panel.interface";
import { BlockForm } from "../forms/block-form";
import InsertBlockModal from "../modals/insert-block-modal";
import QuickActionModal from "../modals/quick-action-modal";
import PanelActionContextMenu from "./action/panel-action-menu";
import { PanelWrapperProvider } from "./context/panel-wrapper-provider";
import { usePanelEditMode } from "./hooks/use-panel-edit-mode";
import { usePanelKeyboardNavigation } from "./hooks/use-panel-keyboard-navigation";
import { usePanelOverlayLock } from "./hooks/use-panel-overlay-lock";
import { usePanelToolbarIndices } from "./hooks/use-panel-toolbar-indices";
import PanelToolbar, { CustomToolbarAction } from "./toolbar/panel-toolbar";

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
    customControls?: React.ReactNode;
    customActions?: CustomToolbarAction[];
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
    customControls,
    customActions = [],
}) => {
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
    const { openDrawer, isEditing, drawerState, startEdit, saveAndExit } = useBlockEdit();
    const { getBlock, getChildren } = useBlockEnvironment();
    const { suppressEditModeTracking } = useLayoutChange();
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

    // Edit mode logic extracted to hook
    const { isEditMode, handleEditClick, handleSaveEditClick, handleDiscardEditClick } =
        usePanelEditMode({
            id,
            hasChildren,
            requestResize,
        });

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

    // Calculate toolbar button indices using hook (single source of truth)
    const toolbarIndices = usePanelToolbarIndices({
        allowInsert,
        hasMenuActions,
        customActionsCount: customActions.length,
        isEditMode,
    });

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

    // Overlay lock management extracted to hook
    usePanelOverlayLock({
        id,
        isSlashOpen,
        isQuickOpen,
        isInlineMenuOpen,
        isDetailsOpen,
        isActionsOpen,
        drawerStateIsOpen: drawerState.isOpen,
        setFocusHover,
    });

    useEffect(() => {
        setDraftTitle(title ?? "");
    }, [title]);

    useEffect(() => {
        if (isInlineMenuOpen) {
            requestAnimationFrame(() => inlineSearchRef.current?.focus());
        }
    }, [isInlineMenuOpen]);

    // Keyboard navigation extracted to hook
    usePanelKeyboardNavigation({
        id,
        isSelected,
        allowInsert,
        actionsLength: actions.length,
        toolbarFocusIndex,
        setToolbarFocusIndex,
        setInlineMenuOpen,
        setQuickOpen,
        setDetailsOpen,
        setActionsOpen,
        handleEditClick,
        handleSaveEditClick,
        handleDiscardEditClick,
        customActions,
        toolbarIndices,
        focusSelf,
        setInsertContext,
        hasMenuActions,
        isEditMode,
        hasChildren,
        openDrawer,
        saveAndExit,
        startEdit,
        suppressEditModeTracking,
    });

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

    // Context value for PanelWrapperProvider (eliminates prop drilling to PanelToolbar)
    const contextValue = useMemo(
        () => ({
            id,
            isSlashOpen,
            setSlashOpen,
            isQuickOpen,
            setQuickOpen,
            isInlineMenuOpen,
            setInlineMenuOpen,
            isDetailsOpen,
            setDetailsOpen,
            isActionsOpen,
            setActionsOpen,
            draftTitle,
            setDraftTitle,
            onTitleChange,
            titlePlaceholder,
            insertContext,
            setInsertContext,
            toolbarFocusIndex,
            setToolbarFocusIndex,
            allowInsert,
            hasMenuActions,
            description,
            shouldHighlight,
            isEditMode,
            hasChildren,
        }),
        [
            id,
            isSlashOpen,
            isQuickOpen,
            isInlineMenuOpen,
            isDetailsOpen,
            isActionsOpen,
            draftTitle,
            onTitleChange,
            titlePlaceholder,
            insertContext,
            toolbarFocusIndex,
            allowInsert,
            hasMenuActions,
            description,
            shouldHighlight,
            isEditMode,
            hasChildren,
        ]
    );

    return (
        <PanelWrapperProvider value={contextValue}>
            <PanelActionContextMenu id={id} actions={menuActions} onDelete={onDelete}>
                <div
                    ref={surfaceRef}
                    className={cn(
                        "group flex relative flex-col rounded-sm border text-card-foreground transition-colors w-full p-4 shadow backdrop-blur-sm",
                        "break-words", // Fix for text overflow - ensure long text wraps
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
                                onInlineInsertClick={
                                    allowInsert ? handleInlineInsertOpen : undefined
                                }
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
                                onTitleBlur={handleTitleBlur}
                                menuActions={menuActions}
                                onMenuAction={handleMenuAction}
                                onDetailsOpenChange={handleDetailsOpenChange}
                                onActionsOpenChange={handleActionsOpenChange}
                                onEditClick={handleEditClick}
                                onSaveEditClick={handleSaveEditClick}
                                onDiscardEditClick={handleDiscardEditClick}
                                customActions={customActions}
                            />
                        )}
                    </AnimatePresence>

                    {/* Custom controls section (e.g., list sort/filter controls) */}
                    {customControls && <div className="mb-3 border-b pb-3">{customControls}</div>}

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
        </PanelWrapperProvider>
    );
};

PanelWrapper.displayName = "PanelWrapper";
