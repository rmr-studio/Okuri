import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { SearchIcon } from "lucide-react";
import { FC, RefObject } from "react";
import { SlashMenuItem } from "../../../interface/panel.interface";

interface PanelQuickInsertProps {
    searchRef: RefObject<HTMLInputElement | null>;
    items: SlashMenuItem[];
    onSelectItem: (item: SlashMenuItem) => void;
    onShowAllOptions: () => void;
    onOpenQuickActions: () => void;
}

const PanelQuickInsert: FC<PanelQuickInsertProps> = ({
    searchRef,
    items,
    onSelectItem,
    onShowAllOptions,
    onOpenQuickActions,
}) => {
    return (
        <Command>
            <CommandInput ref={searchRef} placeholder="Search blocks..." />
            <CommandList>
                <CommandEmpty>No matches found.</CommandEmpty>
                <CommandGroup heading="Shortcuts">
                    <CommandItem onSelect={onShowAllOptions}>See all options…</CommandItem>
                    <CommandItem onSelect={onOpenQuickActions}>Open quick actions</CommandItem>
                </CommandGroup>
                <CommandGroup heading="Blocks">
                    {items.map((item) => (
                        <CommandItem
                            key={item.id}
                            onSelect={() => onSelectItem(item)}
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
    );
};

export default PanelQuickInsert;
