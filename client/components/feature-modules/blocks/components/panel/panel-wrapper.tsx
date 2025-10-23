"use client";

import {
    subscribe as focusSubscribe,
    pushSelection,
    removeSelection,
    updateSelection,
} from "@/components/feature-modules/blocks/util/block.focus-manager";
import { blockElements } from "@/components/feature-modules/blocks/util/block.registry";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/util/utils";
import { TypeIcon } from "lucide-react";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import InsertBlockModal from "../modals/insert-block-modal";
import QuickActionModal from "../modals/quick-action-modal";
import PanelToolbar from "./toolbar/panel-toolbar";

export type Mode = "display" | "form";

export interface SlashMenuItem {
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    onSelect?: () => void;
}

export interface QuickActionItem {
    id: string;
    label: string;
    shortcut?: string;
    description?: string;
    onSelect?: () => void;
}

export interface Props {
    id?: string;
    title?: string;
    titlePlaceholder?: string;
    description?: string;
    badge?: string;
    defaultMode?: Mode;
    display?: React.ReactNode;
    form?: React.ReactNode;
    children?: React.ReactNode;
    slashItems?: SlashMenuItem[];
    quickActions?: QuickActionItem[];
    onTitleChange?: (value: string) => void;
    onModeChange?: (mode: Mode) => void;
    onInsert?: (item: SlashMenuItem) => void;
    onInsertSibling?: (item: SlashMenuItem) => void;
    onDelete?: () => void;
    className?: string;
    nested?: React.ReactNode;
    nestedFooter?: React.ReactNode;
    allowInsert?: boolean;
}

export const defaultSlashItems: SlashMenuItem[] = Object.values(blockElements).map((meta) => ({
    id: meta.type,
    label: meta.name ?? meta.type,
    description: meta.description,
    icon: <TypeIcon className="size-4" />,
}));

export const PanelWrapper: React.FC<Props> = ({
    id,
    title,
    titlePlaceholder = "Untitled block",
    description,
    badge,
    defaultMode = "display",
    display,
    form,
    children,
    slashItems,
    quickActions,
    onTitleChange,
    onModeChange,
    onInsert,
    onInsertSibling,
    onDelete,
    className,
    nested,
    nestedFooter,
    allowInsert = false,
}) => {
    // todo: Move alot of this wrapper state into a context provider to reduce prop drilling

    const panelId = useId();
    const surfaceId = id ?? panelId;
    const [isSelected, setIsSelected] = useState(false);
    const [mode, setMode] = useState<Mode>(defaultMode);
    const [isSlashOpen, setSlashOpen] = useState(false);
    const [isQuickOpen, setQuickOpen] = useState(false);
    const [isInlineMenuOpen, setInlineMenuOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState(title ?? "");
    const [insertContext, setInsertContext] = useState<"nested" | "sibling">("nested");
    const [isHovered, setHovered] = useState(false);
    const inlineSearchRef = useRef<HTMLInputElement | null>(null);

    const content = mode === "form" ? form : display ?? children;
    const showInsertHandle =
        allowInsert && (isSelected || isInlineMenuOpen || isQuickOpen || isSlashOpen || isHovered);

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
    const toolbarVisible = shouldHighlight;

    useEffect(() => {
        const unsubscribe = focusSubscribe((selection) => {
            setIsSelected(selection?.type === "panel" && selection.id === surfaceId);
        });
        return () => {
            if (typeof unsubscribe === "function") {
                unsubscribe();
            }
        };
    }, [surfaceId]);

    useEffect(() => {
        if (!isSelected) return;
        updateSelection({ type: "panel", id: surfaceId, onDelete });
    }, [isSelected, onDelete, surfaceId]);

    useEffect(() => {
        return () => {
            removeSelection("panel", surfaceId);
        };
    }, [surfaceId]);

    useEffect(() => {
        setDraftTitle(title ?? "");
    }, [title]);

    useEffect(() => {
        if (isInlineMenuOpen) {
            requestAnimationFrame(() => inlineSearchRef.current?.focus());
        }
    }, [isInlineMenuOpen]);

    const toggleMode = useCallback(() => {
        setMode((prev) => {
            const next = prev === "display" ? "form" : "display";
            onModeChange?.(next);
            return next;
        });
    }, [onModeChange]);

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
                pushSelection({ type: "panel", id: surfaceId, onDelete });
                setInlineMenuOpen(true);
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
                event.preventDefault();
                toggleMode();
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (allowInsert && actions.length === 0) {
                    setInsertContext("nested");
                    pushSelection({ type: "panel", id: surfaceId, onDelete });
                    setInlineMenuOpen(true);
                } else {
                    setQuickOpen(true);
                    pushSelection({ type: "panel", id: surfaceId, onDelete });
                }
            }
        };

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [allowInsert, toggleMode, actions.length, isSelected, surfaceId, onDelete]);

    const handleTitleBlur = useCallback(() => {
        if (draftTitle !== title) onTitleChange?.(draftTitle);
    }, [draftTitle, onTitleChange, title]);

    const handleOpenInsertModal = useCallback(() => {
        if (!allowInsert) return;
        setInlineMenuOpen(false);
        setSlashOpen(true);
        pushSelection({ type: "panel", id: surfaceId, onDelete });
    }, [allowInsert, setInlineMenuOpen, setSlashOpen, surfaceId, onDelete]);

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
            item.onSelect?.();
        },
        [setQuickOpen]
    );

    const handleMenuAction = useCallback((item: QuickActionItem) => {
        item.onSelect?.();
    }, []);

    const modeLabel = useMemo(() => (mode === "display" ? "Display" : "Form"), [mode]);

    const handleToggleModeClick = useCallback(() => {
        toggleMode();
        pushSelection({ type: "panel", id: surfaceId, onDelete });
    }, [toggleMode, surfaceId, onDelete]);

    const handleQuickActionsOpen = useCallback(() => {
        setQuickOpen(true);
        pushSelection({ type: "panel", id: surfaceId, onDelete });
    }, [setQuickOpen, surfaceId, onDelete]);

    const handleInlineInsertOpen = useCallback(() => {
        if (!allowInsert) return;
        setInsertContext("nested");
        setInlineMenuOpen(true);
        pushSelection({ type: "panel", id: surfaceId, onDelete });
    }, [allowInsert, setInsertContext, setInlineMenuOpen, surfaceId, onDelete]);

    const handleQuickInsertOpenQuickActions = useCallback(() => {
        if (!allowInsert) return;
        setInlineMenuOpen(false);
        setQuickOpen(true);
        pushSelection({ type: "panel", id: surfaceId, onDelete });
    }, [allowInsert, setInlineMenuOpen, setQuickOpen, surfaceId, onDelete]);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    className={cn(
                        "group relative flex flex-col rounded-xl border text-card-foreground transition-colors",
                        allowInsert
                            ? shouldHighlight
                                ? "border-primary ring-2 ring-primary/30 bg-card shadow-sm"
                                : isHovered
                                ? "border-primary/40 bg-card/90 shadow-sm"
                                : "border-border bg-card/80 shadow-sm"
                            : shouldHighlight
                            ? "border-primary/70 bg-background/80"
                            : "border-transparent bg-transparent",
                        className
                    )}
                    data-surface-id={surfaceId}
                    tabIndex={-1}
                    onPointerOver={(event) => {
                        const targetBlock = (event.target as HTMLElement | null)?.closest(
                            "[data-block-id]"
                        );
                        if (targetBlock) {
                            setHovered(false);
                            return;
                        }
                        const targetSurface = (event.target as HTMLElement | null)?.closest(
                            "[data-surface-id]"
                        );
                        if (!targetSurface || targetSurface === event.currentTarget) {
                            setHovered(true);
                        } else {
                            setHovered(false);
                        }
                    }}
                    onPointerLeave={() => setHovered(false)}
                    onPointerDown={(event) => {
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
                        pushSelection({ type: "panel", id: surfaceId, onDelete });
                    }}
                    onFocusCapture={() => {
                        pushSelection({ type: "panel", id: surfaceId, onDelete });
                    }}
                >
                    <PanelToolbar
                        visible={toolbarVisible}
                        mode={mode}
                        onToggleMode={handleToggleModeClick}
                        onQuickActionsClick={handleQuickActionsOpen}
                        allowInsert={allowInsert}
                        onInlineInsertClick={allowInsert ? handleInlineInsertOpen : undefined}
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
                        badge={badge}
                        hasMenuActions={hasMenuActions}
                        menuActions={menuActions}
                        onMenuAction={handleMenuAction}
                    />
                    <section
                        className={cn(
                            allowInsert ? "pb-10" : "pb-4",
                            "pt-11",
                            allowInsert ? "px-4" : "px-3"
                        )}
                    >
                        <div
                            className={cn(
                                "rounded-lg border bg-background/40 p-4",
                                !allowInsert && "border-transparent bg-transparent p-0"
                            )}
                        >
                            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                {modeLabel}
                            </div>
                            {content ?? (
                                <div className="text-sm text-muted-foreground">
                                    {mode === "form"
                                        ? "This block does not have a form configuration yet."
                                        : "This block has no display content yet."}
                                </div>
                            )}
                        </div>
                        {nested ? <div className="mt-6 space-y-6">{nested}</div> : null}
                    </section>

                    {allowInsert ? (
                        <InsertBlockModal
                            open={isSlashOpen}
                            onOpenChange={setSlashOpen}
                            onSelect={handleSelect}
                            items={items}
                        />
                    ) : null}
                    <QuickActionModal
                        open={isQuickOpen}
                        setOpen={setQuickOpen}
                        onInsert={allowInsert ? handleOpenInsertModal : undefined}
                        onActionSelect={handleQuickSelect}
                        actions={actions}
                        allowInsert={allowInsert}
                    />
                    {showInsertHandle && nestedFooter ? (
                        <div className="pointer-events-none absolute bottom-3 right-4">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="pointer-events-auto">{nestedFooter}</div>
                                </TooltipTrigger>
                                <TooltipContent>Add nested block</TooltipContent>
                            </Tooltip>
                        </div>
                    ) : null}
                </div>
            </ContextMenuTrigger>
            {hasMenuActions ? (
                <ContextMenuContent className="min-w-[10rem]">
                    {menuActions.map((action, index) => (
                        <React.Fragment key={action.id}>
                            <ContextMenuItem
                                variant={
                                    action.id === "delete" || action.id === "__delete"
                                        ? "destructive"
                                        : "default"
                                }
                                onSelect={() => handleMenuAction(action)}
                            >
                                <span>{action.label}</span>
                                {action.shortcut ? (
                                    <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground">
                                        {action.shortcut}
                                    </span>
                                ) : null}
                            </ContextMenuItem>
                            {index !== menuActions.length - 1 ? <ContextMenuSeparator /> : null}
                        </React.Fragment>
                    ))}
                </ContextMenuContent>
            ) : null}
        </ContextMenu>
    );
};

PanelWrapper.displayName = "PanelWrapper";
