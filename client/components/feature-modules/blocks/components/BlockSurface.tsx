"use client";

import { blockElements } from "@/components/feature-modules/blocks/util/block.registry";
import {
    pushSelection,
    removeSelection,
    updateSelection,
    subscribe as focusSubscribe,
} from "@/components/feature-modules/blocks/util/block.focus-manager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/util/utils";
import {
    CommandIcon,
    GripVerticalIcon,
    InfoIcon,
    LayoutDashboardIcon,
    ListIcon,
    MoreHorizontalIcon,
    PlusIcon,
    SearchIcon,
    TypeIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

type Mode = "display" | "form";

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

export interface BlockSurfaceProps {
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
}

export const defaultSlashItems: SlashMenuItem[] = Object.values(blockElements).map((meta) => ({
    id: meta.type,
    label: meta.name ?? meta.type,
    description: meta.description,
    icon: <TypeIcon className="size-4" />,
    onSelect: meta.component ? undefined : undefined,
}));

export const BlockSurface: React.FC<BlockSurfaceProps> = ({
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
}) => {
    const generatedId = useId();
    const surfaceId = id ?? generatedId;
    const [isSelected, setIsSelected] = useState(false);
    const [mode, setMode] = useState<Mode>(defaultMode);
    const [isSlashOpen, setSlashOpen] = useState(false);
    const [isQuickOpen, setQuickOpen] = useState(false);
    const [isInlineMenuOpen, setInlineMenuOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState(title ?? "");
    const [insertContext, setInsertContext] = useState<"nested" | "sibling">("nested");
    const inlineSearchRef = useRef<HTMLInputElement>(null);

    const content = mode === "form" ? form : display ?? children;

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
    const [isHovered, setHovered] = useState(false);
    const shouldHighlight =
        isSelected || isInlineMenuOpen || isQuickOpen || isSlashOpen || isHovered;
    const toolbarVisible = shouldHighlight;
    const toolbarButtonClass =
        "pointer-events-auto size-7 rounded-md border border-transparent bg-background/90 text-muted-foreground hover:border-border hover:text-foreground transition-colors";

    useEffect(() => {
        return focusSubscribe((selection) => {
            setIsSelected(selection?.type === "panel" && selection.id === surfaceId);
        });
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

            if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
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
                if (actions.length === 0) {
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
    }, [toggleMode, actions.length, isSelected, surfaceId, onDelete]);

    const handleTitleBlur = useCallback(() => {
        if (draftTitle !== title) onTitleChange?.(draftTitle);
    }, [draftTitle, onTitleChange, title]);

    const handleSelect = useCallback(
        (item: SlashMenuItem) => {
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
        [insertContext, onInsert, onInsertSibling]
    );

    const handleQuickSelect = useCallback((item: QuickActionItem) => {
        setQuickOpen(false);
        item.onSelect?.();
    }, []);

    const handleMenuAction = useCallback((item: QuickActionItem) => {
        item.onSelect?.();
    }, []);

    const modeLabel = useMemo(() => (mode === "display" ? "Display" : "Form"), [mode]);

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    className={cn(
                        "group relative flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm transition-colors",
                        shouldHighlight
                            ? "border-primary ring-2 ring-primary/30"
                            : isHovered
                                ? "border-primary/50"
                                : "border-border",
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
                    <div
                        className={cn(
                            "absolute left-3 top-3 z-30 flex items-center gap-1 rounded-md border bg-background/95 px-2 py-1 text-xs shadow-sm transition-opacity",
                            toolbarVisible ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
                        )}
                    >
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Drag block"
                            className={cn("block-drag-handle cursor-grab", toolbarButtonClass)}
                        >
                            <GripVerticalIcon className="size-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={mode === "display" ? "Switch to form" : "Switch to display"}
                            className={toolbarButtonClass}
                            onClick={() => {
                                toggleMode();
                                pushSelection({ type: "panel", id: surfaceId, onDelete });
                            }}
                        >
                            {mode === "display" ? (
                                <LayoutDashboardIcon className="size-3.5" />
                            ) : (
                                <ListIcon className="size-3.5" />
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Quick actions"
                            className={toolbarButtonClass}
                            onClick={() => {
                                setQuickOpen(true);
                                pushSelection({ type: "panel", id: surfaceId, onDelete });
                            }}
                        >
                            <CommandIcon className="size-3.5" />
                        </Button>
                        <Popover open={isInlineMenuOpen} onOpenChange={setInlineMenuOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Insert block"
                                    className={toolbarButtonClass}
                                    onClick={() => {
                                        setInsertContext("nested");
                                        setInlineMenuOpen(true);
                                        pushSelection({ type: "panel", id: surfaceId, onDelete });
                                    }}
                                >
                                    <PlusIcon className="size-3.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-0" align="start">
                                <Command>
                                    <CommandInput ref={inlineSearchRef} placeholder="Search blocks..." />
                                    <CommandList>
                                        <CommandEmpty>No matches found.</CommandEmpty>
                                        <CommandGroup heading="Shortcuts">
                                            <CommandItem
                                                onSelect={() => {
                                                    setInlineMenuOpen(false);
                                                    setSlashOpen(true);
                                                    pushSelection({ type: "panel", id: surfaceId, onDelete });
                                                }}
                                            >
                                                See all options…
                                            </CommandItem>
                                            <CommandItem
                                                onSelect={() => {
                                                    setInlineMenuOpen(false);
                                                    setQuickOpen(true);
                                                    pushSelection({ type: "panel", id: surfaceId, onDelete });
                                                }}
                                            >
                                                Open quick actions
                                            </CommandItem>
                                        </CommandGroup>
                                        <CommandGroup heading="Blocks">
                                            {items.map((item) => (
                                                <CommandItem
                                                    key={item.id}
                                                    onSelect={() => handleSelect(item)}
                                                    className="gap-2"
                                                >
                                                    {item.icon ?? <SearchIcon className="size-4" />}
                                                    <div className="flex flex-col items-start">
                                                        <span>{item.label}</span>
                                                        {item.description ? (
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.description}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Panel details"
                                    className={toolbarButtonClass}
                                >
                                    <InfoIcon className="size-3.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 space-y-3 p-4" align="start">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Title
                                    </label>
                                    <Input
                                        aria-label="Edit title"
                                        value={draftTitle}
                                        placeholder={titlePlaceholder}
                                        onChange={(event) => setDraftTitle(event.target.value)}
                                        onBlur={handleTitleBlur}
                                    />
                                </div>
                                {description ? (
                                    <div className="space-y-1">
                                        <span className="text-xs font-medium text-muted-foreground">
                                            Description
                                        </span>
                                        <p className="rounded-md border bg-muted/30 p-2 text-sm text-muted-foreground">
                                            {description}
                                        </p>
                                    </div>
                                ) : null}
                                {badge ? <Badge variant="secondary">{badge}</Badge> : null}
                            </PopoverContent>
                        </Popover>
                        {hasMenuActions ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        aria-label="More actions"
                                        className={toolbarButtonClass}
                                    >
                                        <MoreHorizontalIcon className="size-3.5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[10rem]">
                                    {menuActions.map((action) => (
                                        <DropdownMenuItem
                                            key={action.id}
                                            variant={
                                                action.id === "delete" || action.id === "__delete"
                                                    ? "destructive"
                                                    : "default"
                                            }
                                            onSelect={(event) => {
                                                event.preventDefault();
                                                handleMenuAction(action);
                                            }}
                                        >
                                            <span>{action.label}</span>
                                            {action.shortcut ? (
                                                <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground">
                                                    {action.shortcut}
                                                </span>
                                            ) : null}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </div>
                    <section className="px-4 pb-4 pt-12">
                        <div className="rounded-lg border bg-background/40 p-4">
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
                        {nestedFooter}
                    </section>

                    <CommandDialog open={isSlashOpen} onOpenChange={setSlashOpen}>
                        <CommandInput placeholder="Search components or templates..." />
                        <CommandList>
                            <CommandEmpty>No matches found.</CommandEmpty>
                            <CommandGroup heading="Insert block">
                                {items.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        onSelect={() => handleSelect(item)}
                                        className="gap-2"
                                    >
                                        {item.icon ?? <SearchIcon className="size-4" />}
                                        <div className="flex flex-col items-start">
                                            <span>{item.label}</span>
                                            {item.description ? (
                                                <span className="text-xs text-muted-foreground">
                                                    {item.description}
                                                </span>
                                            ) : null}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </CommandDialog>

                    <CommandDialog open={isQuickOpen} onOpenChange={setQuickOpen} title="Quick actions">
                        <CommandInput placeholder="Quick actions…" />
                        <CommandList>
                            <CommandEmpty>No actions available.</CommandEmpty>
                            <CommandGroup heading="Insert">
                                <CommandItem
                                    onSelect={() => {
                                        setQuickOpen(false);
                                        setInsertContext("nested");
                                        setInlineMenuOpen(true);
                                        pushSelection({
                                            type: "panel",
                                            id: surfaceId,
                                            onDelete,
                                        });
                                    }}
                                >
                                    Insert block…
                                </CommandItem>
                            </CommandGroup>
                            <CommandGroup heading="Actions">
                                {actions.map((action) => (
                                    <CommandItem
                                        key={action.id}
                                        onSelect={() => handleQuickSelect(action)}
                                        className="gap-2"
                                    >
                                        <CommandIcon className="size-4 opacity-60" />
                                        <span>{action.label}</span>
                                        {action.shortcut ? (
                                            <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground">
                                                {action.shortcut}
                                            </span>
                                        ) : null}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </CommandDialog>
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

BlockSurface.displayName = "BlockSurface";

interface BlockInsertHandleProps {
    slashItems?: SlashMenuItem[];
    onInsert?: (item: SlashMenuItem) => void;
    label?: string;
}

export const BlockInsertHandle: React.FC<BlockInsertHandleProps> = ({
    slashItems,
    onInsert,
    label = "Add block",
}) => {
    const [open, setOpen] = useState(false);
    const items = slashItems ?? defaultSlashItems;

    const handleSelect = useCallback(
        (item: SlashMenuItem) => {
            setOpen(false);
            item.onSelect?.();
            onInsert?.(item);
        },
        [onInsert]
    );

    return (
        <div className="group relative my-8 flex items-center justify-center">
            <div className="h-px flex-1 bg-border transition-colors duration-150 group-hover:bg-primary/40" />
            <Button
                variant="outline"
                size="sm"
                className="mx-3 gap-1"
                onClick={() => setOpen(true)}
            >
                <PlusIcon className="size-4" />
                {label}
            </Button>
            <div className="h-px flex-1 bg-border transition-colors duration-150 group-hover:bg-primary/40" />

            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Search components or templates..." />
                <CommandList>
                    <CommandEmpty>No matches found.</CommandEmpty>
                    <CommandGroup heading="Insert block">
                        {items.map((item) => (
                            <CommandItem
                                key={item.id}
                                onSelect={() => handleSelect(item)}
                                className="gap-2"
                            >
                                {item.icon ?? <SearchIcon className="size-4" />}
                                <div className="flex flex-col items-start">
                                    <span>{item.label}</span>
                                    {item.description ? (
                                        <span className="text-xs text-muted-foreground">
                                            {item.description}
                                        </span>
                                    ) : null}
                                </div>
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </div>
    );
};
