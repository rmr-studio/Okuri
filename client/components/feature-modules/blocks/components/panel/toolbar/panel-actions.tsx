
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MoreHorizontalIcon } from "lucide-react";
import { FC } from "react";
import { QuickActionItem } from "../../../interface/panel.interface";

interface PanelActionsProps {
    menuActions: QuickActionItem[];
    toolbarButtonClass: string;
    onMenuAction: (action: QuickActionItem) => void;
    actionsOpen?: boolean;
    onActionsOpenChange?: (open: boolean) => void;
}

const PanelActions: FC<PanelActionsProps> = ({
    menuActions,
    toolbarButtonClass,
    onMenuAction,
    actionsOpen,
    onActionsOpenChange,
}) => {
    if (menuActions.length === 0) return null;

    return (
        <DropdownMenu
            open={actionsOpen}
            onOpenChange={(open) => {
                onActionsOpenChange?.(open);
                // Blur the trigger when closing to prevent focus sticking
                if (!open) {
                    setTimeout(() => {
                        (document.activeElement as HTMLElement)?.blur();
                    }, 0);
                }
            }}
        >
            <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>More actions</TooltipContent>
            </Tooltip>
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
                            onMenuAction(action);
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
    );
};

export default PanelActions;
