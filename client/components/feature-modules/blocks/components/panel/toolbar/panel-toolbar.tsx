import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/util/utils";
import { CommandIcon, InfoIcon, PlusIcon } from "lucide-react";
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
}) => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={cn(
                "absolute -left-3 -top-3 flex items-center gap-1 rounded-md border bg-background/95 px-2 py-1 text-xs shadow-sm transition-opacity z-[100]"
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
                        className={toolbarButtonClass}
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
                                    className={toolbarButtonClass}
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
            <Popover>
                <Tooltip>
                    <TooltipTrigger asChild>
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
                    toolbarButtonClass={toolbarButtonClass}
                    onMenuAction={onMenuAction}
                />
            ) : null}
        </motion.div>
    );
};

export default PanelToolbar;
