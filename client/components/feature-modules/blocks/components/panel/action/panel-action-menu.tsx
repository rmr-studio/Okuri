import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { FC, Fragment, useMemo } from "react";
import { QuickActionItem } from "../../../interface/panel.interface";

interface Props extends ChildNodeProps {
    id: string;
    actions: QuickActionItem[];
    onDelete?: (id: string) => void;
}

const PanelActionContextMenu: FC<Props> = ({ id, actions, children, onDelete }) => {
    // Ensure delete action is always present, given its associated callback is provided
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

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div>{children}</div>
            </ContextMenuTrigger>
            {!!menuActions.length && (
                <ContextMenuContent className="min-w-[10rem]">
                    {menuActions.map((action, index) => (
                        <Fragment key={action.id}>
                            <ContextMenuItem
                                variant={
                                    action.id === "delete" || action.id === "__delete"
                                        ? "destructive"
                                        : "default"
                                }
                                onSelect={() => action.onSelect(id)}
                            >
                                <span>{action.label}</span>
                                {action.shortcut ? (
                                    <span className="ml-auto text-xs uppercase tracking-wide text-muted-foreground">
                                        {action.shortcut}
                                    </span>
                                ) : null}
                            </ContextMenuItem>
                            {index !== menuActions.length - 1 ? <ContextMenuSeparator /> : null}
                        </Fragment>
                    ))}
                </ContextMenuContent>
            )}
        </ContextMenu>
    );
};

export default PanelActionContextMenu;
