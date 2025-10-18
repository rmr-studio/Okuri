"use client";

import { blockElements } from "@/components/feature-modules/blocks/util/block.registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/util/utils";
import {
    CommandIcon,
    LayoutDashboardIcon,
    ListIcon,
    MoreHorizontalIcon,
    PlusIcon,
    SearchIcon,
    TypeIcon,
} from "lucide-react";
import React, { useCallback, useEffect, useId, useMemo, useState } from "react";

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
    /**
     * Optional children are rendered in the content area when `display` is not provided.
     */
    children?: React.ReactNode;
    slashItems?: SlashMenuItem[];
    quickActions?: QuickActionItem[];
    onTitleChange?: (value: string) => void;
    onModeChange?: (mode: Mode) => void;
    onInsert?: (item: SlashMenuItem) => void;
    className?: string;
}

export const defaultSlashItems: SlashMenuItem[] = Object.values(blockElements).map((meta) => ({
    id: meta.type,
    label: meta.name ?? meta.type,
    description: meta.description,
    icon: <TypeIcon className="size-4" />,
    onSelect: meta.component ? undefined : undefined,
}));

type ActiveListener = (id: string | null) => void;
const activeListeners = new Set<ActiveListener>();
let activeSurfaceId: string | null = null;

function setActiveSurface(id: string | null) {
    activeSurfaceId = id;
    activeListeners.forEach((listener) => listener(activeSurfaceId));
}

function useIsSurfaceActive(id: string): boolean {
    const [isActive, setIsActive] = useState(activeSurfaceId === id);

    useEffect(() => {
        const listener: ActiveListener = (current) => setIsActive(current === id);
        activeListeners.add(listener);
        return () => {
            activeListeners.delete(listener);
        };
    }, [id]);

    return isActive;
}

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
    className,
    nested,
    nestedFooter,
}) => {
    const generatedId = useId();
    const surfaceId = id ?? generatedId;
    const isActive = useIsSurfaceActive(surfaceId);
    const [mode, setMode] = useState<Mode>(defaultMode);
    const [isSlashOpen, setSlashOpen] = useState(false);
    const [isQuickOpen, setQuickOpen] = useState(false);
    const [draftTitle, setDraftTitle] = useState(title ?? "");
    const [insertContext, setInsertContext] = useState<"nested" | "sibling">("nested");

    const content = mode === "form" ? form : display ?? children;

    const items = slashItems ?? defaultSlashItems;
    const actions = quickActions ?? [];

    useEffect(() => {
        setDraftTitle(title ?? "");
    }, [title]);

    const toggleMode = useCallback(() => {
        setMode((prev) => {
            const next = prev === "display" ? "form" : "display";
            onModeChange?.(next);
            return next;
        });
    }, [onModeChange]);

    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (!isActive) return;
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
                setSlashOpen(true);
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "e") {
                event.preventDefault();
                toggleMode();
            }

            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
                event.preventDefault();
                if (actions.length === 0) {
                    setInsertContext("nested");
                    setSlashOpen(true);
                } else {
                    setQuickOpen(true);
                }
            }
        };

        if (!isActive) return;

        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [toggleMode, actions.length, isActive]);

    const handleTitleBlur = useCallback(() => {
        if (draftTitle !== title) onTitleChange?.(draftTitle);
    }, [draftTitle, onTitleChange, title]);

    const handleSelect = useCallback(
        (item: SlashMenuItem) => {
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

    const modeLabel = useMemo(() => (mode === "display" ? "Display" : "Form"), [mode]);

    return (
        <div
            className={cn(
                "bg-card text-card-foreground rounded-xl border shadow-sm transition-colors",
                className
            )}
            tabIndex={-1}
            onMouseDown={() => setActiveSurface(surfaceId)}
            onFocusCapture={() => setActiveSurface(surfaceId)}
        >
            <header className="flex flex-col gap-2 border-b p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-3">
                    <Input
                        aria-label="Block title"
                        value={draftTitle}
                        placeholder={titlePlaceholder}
                        onChange={(event) => setDraftTitle(event.target.value)}
                        onBlur={handleTitleBlur}
                        className="h-9 flex-1 border-none px-0 text-lg font-semibold focus-visible:ring-0"
                    />
                    {badge ? <Badge variant="secondary">{badge}</Badge> : null}
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="gap-1" onClick={toggleMode}>
                        {mode === "display" ? (
                            <>
                                <LayoutDashboardIcon className="size-4" />
                                Display
                            </>
                        ) : (
                            <>
                                <ListIcon className="size-4" />
                                Form
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className={cn("gap-1", actions.length === 0 && "opacity-70")}
                        onClick={() => {
                            if (actions.length === 0) {
                                setInsertContext("nested");
                                setSlashOpen(true);
                            } else {
                                setQuickOpen(true);
                            }
                        }}
                    >
                        <CommandIcon className="size-4" />
                        Cmd+K
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => {
                            setInsertContext("nested");
                            setSlashOpen(true);
                        }}
                    >
                        <PlusIcon className="size-4" />
                        Insert
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontalIcon className="size-4" />
                    </Button>
                </div>
            </header>
            {description ? (
                <div className="px-4 pb-2 text-sm text-muted-foreground">{description}</div>
            ) : null}
            <section className="px-4 pb-4">
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
