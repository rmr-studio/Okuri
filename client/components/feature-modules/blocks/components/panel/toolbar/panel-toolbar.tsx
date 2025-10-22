import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/util/utils";
import {
    CommandIcon,
    GripVerticalIcon,
    InfoIcon,
    LayoutDashboardIcon,
    ListIcon,
    PlusIcon,
} from "lucide-react";
import { FC, RefObject } from "react";
import type { Mode, QuickActionItem, SlashMenuItem } from "../panel-wrapper";
import PanelActions from "./panel-actions";
import PanelDetails from "./panel-details";
import PanelQuickInsert from "./panel-quick-insert";

interface PanelToolbarProps {
    visible: boolean;
    mode: Mode;
    onToggleMode: () => void;
    onQuickActionsClick: () => void;
    onInlineInsertClick: () => void;
    inlineMenuOpen: boolean;
    onInlineMenuOpenChange: (open: boolean) => void;
    inlineSearchRef: RefObject<HTMLInputElement | null>;
    items: SlashMenuItem[];
    onSelectItem: (item: SlashMenuItem) => void;
    onShowAllOptions: () => void;
    onOpenQuickActionsFromInline: () => void;
    draftTitle: string;
    onDraftTitleChange: (value: string) => void;
    onTitleBlur: () => void;
    titlePlaceholder: string;
    description?: string;
    badge?: string;
    hasMenuActions: boolean;
    menuActions: QuickActionItem[];
    onMenuAction: (action: QuickActionItem) => void;
}

const toolbarButtonClass =
    "pointer-events-auto size-7 rounded-md border border-transparent bg-background/90 text-muted-foreground hover:border-border hover:text-foreground transition-colors";

const PanelToolbar: FC<PanelToolbarProps> = ({
    visible,
    mode,
    onToggleMode,
    onQuickActionsClick,
    onInlineInsertClick,
    inlineMenuOpen,
    onInlineMenuOpenChange,
    inlineSearchRef,
    items,
    onSelectItem,
    onShowAllOptions,
    onOpenQuickActionsFromInline,
    draftTitle,
    onDraftTitleChange,
    onTitleBlur,
    titlePlaceholder,
    description,
    badge,
    hasMenuActions,
    menuActions,
    onMenuAction,
}) => {
    return (
        <div
            className={cn(
                "absolute left-3 top-3 z-30 flex items-center gap-1 rounded-md border bg-background/95 px-2 py-1 text-xs shadow-sm transition-opacity",
                visible ? "opacity-100 pointer-events-auto" : "pointer-events-none opacity-0"
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
                onClick={onToggleMode}
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
                onClick={onQuickActionsClick}
            >
                <CommandIcon className="size-3.5" />
            </Button>

            <Popover open={inlineMenuOpen} onOpenChange={onInlineMenuOpenChange}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Insert block"
                        className={toolbarButtonClass}
                        onClick={onInlineInsertClick}
                    >
                        <PlusIcon className="size-3.5" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="start">
                    <PanelQuickInsert
                        searchRef={inlineSearchRef}
                        items={items}
                        onSelectItem={onSelectItem}
                        onShowAllOptions={onShowAllOptions}
                        onOpenQuickActions={onOpenQuickActionsFromInline}
                    />
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
                    <PanelDetails
                        draftTitle={draftTitle}
                        onDraftTitleChange={onDraftTitleChange}
                        onTitleBlur={onTitleBlur}
                        titlePlaceholder={titlePlaceholder}
                        description={description}
                        badge={badge}
                    />
                </PopoverContent>
            </Popover>
            {hasMenuActions ? (
                <PanelActions
                    menuActions={menuActions}
                    toolbarButtonClass={toolbarButtonClass}
                    onMenuAction={onMenuAction}
                />
            ) : null}
        </div>
    );
};

export default PanelToolbar;
