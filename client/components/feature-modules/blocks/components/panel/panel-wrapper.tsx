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
    const [draftTitle, setDraftTitle] = useState(title ?? "");
    const [insertContext, setInsertContext] = useState<"nested" | "sibling">("nested");
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

    useEffect(() => {
        const shouldLock = isSlashOpen || isQuickOpen || isInlineMenuOpen;
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

    useEffect(() => {
        if (!isSelected) return;

        const handler = (event: KeyboardEvent) => {
            const active = document.activeElement;
            const isInput =
                active &&
                (active.tagName === "INPUT" ||
                    active.tagName === "TEXTAREA" ||
                    active.getAttribute("contenteditable") === "true");

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
    }, [allowInsert, actions.length, focusSelf, isSelected]);

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
