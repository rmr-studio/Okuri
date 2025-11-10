"use client";
import { blockElements } from "@/components/feature-modules/blocks/util/block/block.registry";
import { ChildNodeProps, ClassNameProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { AnimatePresence } from "framer-motion";
import { TypeIcon } from "lucide-react";
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useBlockFocus } from "../../context/block-focus-provider";
import { useFocusSurface } from "../../hooks/use-focus-surface";
import { QuickActionItem, SlashMenuItem } from "../../interface/panel.interface";
import InsertBlockModal from "../modals/insert-block-modal";
import QuickActionModal from "../modals/quick-action-modal";
import PanelActionContextMenu from "./action/panel-action-menu";
import PanelToolbar from "./toolbar/panel-toolbar";

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
    const actions = quickActions ?? [];
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

        // Calculate which button each menu corresponds to
        let buttonIndex = 0;
        const quickActionsIndex = buttonIndex++;
        const insertIndex = allowInsert ? buttonIndex++ : -1;
        const detailsIndex = buttonIndex++;
        const actionsMenuIndex = hasMenuActions ? buttonIndex++ : -1;

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
    }, [toolbarFocusIndex, isSelected, allowInsert, hasMenuActions, isQuickOpen, isInlineMenuOpen, isDetailsOpen, isActionsOpen]);

    useEffect(() => {
        const shouldLock = isSlashOpen || isQuickOpen || isInlineMenuOpen || isDetailsOpen || isActionsOpen;
        // Acquire or release overlay lock based on menu state
        if (!shouldLock && overlayLockRef.current) {
            overlayLockRef.current();
            overlayLockRef.current = null;
        } else if (shouldLock && !overlayLockRef.current) {
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
    }, [id, acquireLock, isInlineMenuOpen, isQuickOpen, isSlashOpen]);

    useEffect(() => {
        setDraftTitle(title ?? "");
    }, [title]);

    useEffect(() => {
        if (isInlineMenuOpen) {
            requestAnimationFrame(() => inlineSearchRef.current?.focus());
        }
    }, [isInlineMenuOpen]);

    // Calculate total toolbar buttons
    const toolbarButtonCount = useMemo(() => {
        let count = 2; // Quick Actions + Panel Details (always present)
        if (allowInsert) count++; // Insert Block button
        if (hasMenuActions) count++; // Action Menu button
        return count;
    }, [allowInsert, hasMenuActions]);

    useEffect(() => {
        if (!isSelected) return;

        const handler = (event: KeyboardEvent) => {
            const active = document.activeElement;
            const isInput =
                active &&
                (active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA" ||
                    active.getAttribute("contenteditable") === "true");

            // Toolbar navigation with Left/Right arrows
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                if (isInput) return;
                event.preventDefault();

                if (toolbarFocusIndex === -1) {
                    // First time pressing arrow - focus first toolbar button
                    setToolbarFocusIndex(0);
                } else {
                    // Navigate between toolbar buttons
                    if (event.key === "ArrowLeft") {
                        setToolbarFocusIndex((prev) =>
                            prev <= 0 ? toolbarButtonCount - 1 : prev - 1
                        );
                    } else {
                        setToolbarFocusIndex((prev) =>
                            prev >= toolbarButtonCount - 1 ? 0 : prev + 1
                        );
                    }
                }
                return;
            }

            // Activate focused toolbar button with Enter
            if (event.key === "Enter" && toolbarFocusIndex >= 0) {
                if (isInput) return;
                event.preventDefault();

                // Determine which menu should be opened
                let buttonIndex = 0;
                let targetMenu: "quick" | "insert" | "details" | "actions" | null = null;

                if (toolbarFocusIndex === buttonIndex++) {
                    targetMenu = "quick";
                } else if (allowInsert && toolbarFocusIndex === buttonIndex++) {
                    targetMenu = "insert";
                } else if (toolbarFocusIndex === buttonIndex++) {
                    targetMenu = "details";
                } else if (hasMenuActions && toolbarFocusIndex === buttonIndex++) {
                    targetMenu = "actions";
                }

                // Close all menus except the target, then open the target
                setQuickOpen(targetMenu === "quick");
                setInlineMenuOpen(targetMenu === "insert");
                setDetailsOpen(targetMenu === "details");
                setActionsOpen(targetMenu === "actions");

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

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
                event.preventDefault();
                // TODO. Set up inline edit mode. Or separate data drawer
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
    }, [allowInsert, actions.length, focusSelf, isSelected, toolbarFocusIndex, toolbarButtonCount, hasMenuActions]);

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
        setQuickOpen(true);
        focusSelf();
    }, [focusSelf, setQuickOpen]);

    const handleInlineInsertOpen = useCallback(() => {
        if (!allowInsert) return;
        setInsertContext("nested");
        setInlineMenuOpen(true);
        focusSelf();
    }, [allowInsert, focusSelf, setInlineMenuOpen]);

    const handleQuickInsertOpenQuickActions = useCallback(() => {
        if (!allowInsert) return;
        setInlineMenuOpen(false);
        setQuickOpen(true);
        focusSelf();
    }, [allowInsert, focusSelf, setInlineMenuOpen, setQuickOpen]);

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
                                    allowInsert ? (open) => setInlineMenuOpen(open) : undefined
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
                                onDetailsOpenChange={(open) => setDetailsOpen(open)}
                                actionsOpen={isActionsOpen}
                                onActionsOpenChange={(open) => setActionsOpen(open)}
                            />
                        )}
                    </AnimatePresence>
                    {children}
                    {allowInsert && (
                        <InsertBlockModal
                            open={isSlashOpen}
                            onOpenChange={setSlashOpen}
                            onSelect={handleSelect}
                            items={items}
                        />
                    )}

                    <QuickActionModal
                        open={isQuickOpen}
                        setOpen={setQuickOpen}
                        onInsert={allowInsert ? handleOpenInsertModal : undefined}
                        onActionSelect={handleQuickSelect}
                        actions={actions}
                        allowInsert={allowInsert}
                    />
                </div>
            </PanelActionContextMenu>
        </>
    );
};

PanelWrapper.displayName = "PanelWrapper";
