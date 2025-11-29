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
import { Check, CommandIcon, Edit3, InfoIcon, PlusIcon, X } from "lucide-react";
import { FC, RefObject, ReactNode } from "react";

import { motion } from "framer-motion";
import { usePanelWrapperContext } from "../context/panel-wrapper-provider";
import { usePanelToolbarIndices } from "../hooks/use-panel-toolbar-indices";
import { QuickActionItem, SlashMenuItem } from "../../../interface/panel.interface";
import PanelActions from "./panel-actions";
import PanelDetails from "./panel-details";
import PanelQuickInsert from "./panel-quick-insert";

/**
 * Custom toolbar action - allows injecting additional buttons into the toolbar
 */
export interface CustomToolbarAction {
    id: string;
    icon: ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    badge?: string | number; // Optional badge (e.g., count of selected items)
}

interface PanelToolbarProps {
    visible: boolean;
    onQuickActionsClick: () => void;
    onInlineInsertClick?: () => void;
    onInlineMenuOpenChange?: (open: boolean) => void;
    inlineSearchRef?: RefObject<HTMLInputElement | null>;
    items?: SlashMenuItem[];
    onSelectItem?: (item: SlashMenuItem) => void;
    onShowAllOptions?: () => void;
    onOpenQuickActionsFromInline?: () => void;
    onTitleBlur: () => void;
    badge?: string;
    menuActions: QuickActionItem[];
    onMenuAction: (action: QuickActionItem) => void;
    onDetailsOpenChange?: (open: boolean) => void;
    onActionsOpenChange?: (open: boolean) => void;
    onEditClick?: () => void;
    onSaveEditClick?: () => void;
    onDiscardEditClick?: () => void;
    customActions?: CustomToolbarAction[]; // Custom toolbar actions (e.g., entity selector)
}

const toolbarButtonClass =
    "pointer-events-auto size-7 rounded-md border border-transparent bg-background/90 text-muted-foreground hover:border-border hover:text-foreground transition-colors";

const PanelToolbar: FC<PanelToolbarProps> = ({
    onQuickActionsClick,
    onInlineInsertClick,
    onInlineMenuOpenChange,
    inlineSearchRef,
    items,
    onSelectItem,
    onShowAllOptions,
    onOpenQuickActionsFromInline,
    onTitleBlur,
    badge,
    menuActions,
    onMenuAction,
    onDetailsOpenChange,
    onActionsOpenChange,
    onEditClick,
    onSaveEditClick,
    onDiscardEditClick,
    customActions = [],
}) => {
    // Consume context values (eliminates prop drilling)
    const {
        draftTitle,
        setDraftTitle,
        titlePlaceholder,
        description,
        toolbarFocusIndex,
        isDetailsOpen,
        isActionsOpen,
        isEditMode,
        hasChildren,
        hasMenuActions,
        allowInsert,
        isInlineMenuOpen,
    } = usePanelWrapperContext();

    // Use shared toolbar indices hook (single source of truth)
    const toolbarIndices = usePanelToolbarIndices({
        allowInsert,
        hasMenuActions,
        customActionsCount: customActions.length,
        isEditMode,
    });

    const {
        quickActionsIndex,
        insertIndex,
        editIndex,
        customActionsIndices,
        saveEditIndex,
        discardEditIndex,
        detailsIndex,
        actionsMenuIndex,
    } = toolbarIndices;

    // Helper to get button class with focus highlight
    const getButtonClass = (index: number) => {
        const isFocused = toolbarFocusIndex === index;
        return cn(
            toolbarButtonClass,
            isFocused && "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
        );
    };
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
            inlineSearchRef &&
            items &&
            onSelectItem &&
            onShowAllOptions &&
            onOpenQuickActionsFromInline ? (
                <Popover open={isInlineMenuOpen} onOpenChange={onInlineMenuOpenChange}>
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
                                isEditMode &&
                                    "bg-primary text-primary-foreground hover:bg-primary/90"
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

            {/* Custom toolbar actions (e.g., entity selector) */}
            {customActions.length > 0 && (
                <>
                    {/* Divider before custom actions */}
                    <div className="h-5 w-px bg-border mx-0.5" />

                    {customActions.map((action, index) => (
                        <Tooltip key={action.id}>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label={action.label}
                                    className={cn(
                                        getButtonClass(customActionsIndices[index]),
                                        action.disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                    onClick={action.onClick}
                                    disabled={action.disabled}
                                >
                                    <div className="relative">
                                        {action.icon}
                                        {action.badge && (
                                            <span className="absolute -top-1 -right-1 size-3 flex items-center justify-center text-[8px] font-semibold bg-primary text-primary-foreground rounded-full">
                                                {action.badge}
                                            </span>
                                        )}
                                    </div>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>{action.label}</TooltipContent>
                        </Tooltip>
                    ))}
                </>
            )}

            {/* Edit mode actions - Save and Discard */}
            {isEditMode && onSaveEditClick && onDiscardEditClick && (
                <>
                    {/* Divider */}
                    <div className="h-5 w-px bg-border mx-0.5" />

                    {/* Save button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Save changes"
                                className={cn(
                                    getButtonClass(saveEditIndex),
                                    "size-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                )}
                                onClick={onSaveEditClick}
                            >
                                <Check className="size-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Save changes</TooltipContent>
                    </Tooltip>

                    {/* Discard button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Discard changes"
                                className={cn(
                                    getButtonClass(discardEditIndex),
                                    "size-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                                )}
                                onClick={onDiscardEditClick}
                            >
                                <X className="size-3" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Discard changes</TooltipContent>
                    </Tooltip>
                </>
            )}

            <Popover open={isDetailsOpen} onOpenChange={onDetailsOpenChange}>
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
                        onDraftTitleChange={setDraftTitle}
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
                    actionsOpen={isActionsOpen}
                    onActionsOpenChange={onActionsOpenChange}
                />
            ) : null}
        </motion.div>
    );
};

export default PanelToolbar;
