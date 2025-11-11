/**
 * PanelToolbar - Main toolbar component for panels
 *
 * Toolbar Menu Pattern:
 * When adding new toolbar menus, always use Popover + Command components, NOT DropdownMenu.
 * DropdownMenu causes DOM focus issues with keyboard navigation. See panel-actions.tsx
 * for implementation reference.
 */

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/util/utils";
import { CommandIcon, InfoIcon, PlusIcon, Edit3 } from "lucide-react";
import { FC, RefObject } from "react";

import { motion } from "framer-motion";
import { QuickActionItem, SlashMenuItem } from "../../../interface/panel.interface";
import PanelActions from "./panel-actions";
import PanelDetails from "./panel-details";
import PanelQuickInsert from "./panel-quick-insert";

interface PanelToolbarProps {
    visible: boolean;
    onQuickActionsClick: () => void;
    allowInsert: boolean;
    onInlineInsertClick?: () => void;
    inlineMenuOpen?: boolean;
    onInlineMenuOpenChange?: (open: boolean) => void;
    inlineSearchRef?: RefObject<HTMLInputElement | null>;
    items?: SlashMenuItem[];
    onSelectItem?: (item: SlashMenuItem) => void;
    onShowAllOptions?: () => void;
    onOpenQuickActionsFromInline?: () => void;
    draftTitle: string;
    onDraftTitleChange: (value: string) => void;
    onTitleBlur: () => void;
    titlePlaceholder: string;
    description?: string;
    badge?: string;
    hasMenuActions: boolean;
    menuActions: QuickActionItem[];
    onMenuAction: (action: QuickActionItem) => void;
    toolbarFocusIndex?: number;
    detailsOpen?: boolean;
    onDetailsOpenChange?: (open: boolean) => void;
    actionsOpen?: boolean;
    onActionsOpenChange?: (open: boolean) => void;
    onEditClick?: () => void;
    isEditMode?: boolean;
    hasChildren?: boolean;
}

const toolbarButtonClass =
    "pointer-events-auto size-7 rounded-md border border-transparent bg-background/90 text-muted-foreground hover:border-border hover:text-foreground transition-colors";

const PanelToolbar: FC<PanelToolbarProps> = ({
    onQuickActionsClick,
    allowInsert,
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
    toolbarFocusIndex = -1,
    detailsOpen,
    onDetailsOpenChange,
    actionsOpen,
    onActionsOpenChange,
    onEditClick,
    isEditMode = false,
    hasChildren = false,
}) => {
    // Helper to get button class with focus highlight
    const getButtonClass = (index: number) => {
        const isFocused = toolbarFocusIndex === index;
        return cn(
            toolbarButtonClass,
            isFocused && "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
        );
    };

    // Calculate button indices
    let buttonIndex = 0;
    const quickActionsIndex = buttonIndex++;
    const insertIndex = allowInsert ? buttonIndex++ : -1;
    const editIndex = onEditClick ? buttonIndex++ : -1;
    const detailsIndex = buttonIndex++;
    const actionsMenuIndex = hasMenuActions ? buttonIndex++ : -1;
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                "absolute -left-3 -top-3 flex items-center gap-1 rounded-md border bg-background/95 px-2 py-1 text-xs shadow-sm transition-opacity z-[50]"
            )}
        >
            <Tooltip>
                {/* <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                    {mode === "display" ? "Switch to form view" : "Switch to display view"}
                </TooltipContent> */}
            </Tooltip>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Quick actions"
                        className={getButtonClass(quickActionsIndex)}
                        onClick={onQuickActionsClick}
                    >
                        <CommandIcon className="size-3.5" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>Open quick actions</TooltipContent>
            </Tooltip>

            {allowInsert &&
            onInlineInsertClick &&
            onInlineMenuOpenChange &&
            inlineMenuOpen !== undefined &&
            inlineSearchRef &&
            items &&
            onSelectItem &&
            onShowAllOptions &&
            onOpenQuickActionsFromInline ? (
                <Popover open={inlineMenuOpen ?? false} onOpenChange={onInlineMenuOpenChange}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Insert block"
                                    className={getButtonClass(insertIndex)}
                                    onClick={onInlineInsertClick}
                                >
                                    <PlusIcon className="size-3.5" />
                                </Button>
                            </PopoverTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Add block</TooltipContent>
                    </Tooltip>
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
            ) : null}

            {/* Edit button */}
            {onEditClick && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            aria-label={isEditMode ? "Save and exit edit mode" : "Edit block"}
                            className={cn(
                                getButtonClass(editIndex),
                                isEditMode && "bg-primary text-primary-foreground hover:bg-primary/90"
                            )}
                            onClick={onEditClick}
                        >
                            <Edit3 className="size-3.5" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isEditMode
                            ? "Save and exit (⌘E)"
                            : hasChildren
                            ? "Edit children (⌘E)"
                            : "Edit block (⌘E)"}
                        {!hasChildren && (
                            <span className="block text-xs text-muted-foreground mt-1">
                                ⌘⇧E for drawer
                            </span>
                        )}
                    </TooltipContent>
                </Tooltip>
            )}

            <Popover open={detailsOpen} onOpenChange={onDetailsOpenChange}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Panel details"
                                className={getButtonClass(detailsIndex)}
                            >
                                <InfoIcon className="size-3.5" />
                            </Button>
                        </PopoverTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Edit panel details</TooltipContent>
                </Tooltip>
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
                    toolbarButtonClass={getButtonClass(actionsMenuIndex)}
                    onMenuAction={onMenuAction}
                    actionsOpen={actionsOpen}
                    onActionsOpenChange={onActionsOpenChange}
                />
            ) : null}
        </motion.div>
    );
};

export default PanelToolbar;
