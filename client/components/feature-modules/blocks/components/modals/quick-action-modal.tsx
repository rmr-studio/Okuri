import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { CommandIcon } from "lucide-react";
import { FC } from "react";
import { QuickActionItem } from "../panel/panel-wrapper";

interface Props {
    open: boolean;
    setOpen: (open: boolean) => void;
    surfaceId: string;
    onInsert: () => void;
    onActionSelect: (action: QuickActionItem) => void;
    actions: QuickActionItem[];
}

const QuickActionModal: FC<Props> = ({
    open,
    setOpen,
    surfaceId,
    onInsert,
    onActionSelect,
    actions,
}) => {
    return (
        <CommandDialog open={open} onOpenChange={setOpen} title="Quick actions">
            <CommandInput placeholder="Quick actions…" />
            <CommandList>
                <CommandEmpty>No actions available.</CommandEmpty>
                <CommandGroup heading="Insert">
                    <CommandItem onSelect={onInsert}>
                        <CommandIcon className="size-4 opacity-60" />
                        <div className="flex flex-col items-start">
                            <span>Insert Panel</span>
                            <span className="text-xs text-muted-foreground">
                                Add a new panel to this workspace
                            </span>
                        </div>
                    </CommandItem>
                    <CommandItem onSelect={onInsert}>
                        <CommandIcon className="size-4 opacity-60" />
                        <div className="flex flex-col items-start">
                            <span>Insert Block...</span>
                            <span className="text-xs text-muted-foreground">
                                Add a new block to this panel
                            </span>
                        </div>
                    </CommandItem>
                </CommandGroup>
                <CommandGroup heading="Actions">
                    {actions.map((action) => (
                        <CommandItem
                            key={action.id}
                            onSelect={() => onActionSelect(action)}
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
    );
};

export default QuickActionModal;
