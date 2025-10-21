/* -------------------------------------------------------------------------- */
/* Handles & Menus                                                            */
/* -------------------------------------------------------------------------- */

import { Button } from "@/components/ui/button";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Plus, Type } from "lucide-react";
import { FC, useCallback, useState } from "react";
import { SlashMenuItem } from "./panel/panel-wrapper";

interface Props {
    items: SlashMenuItem[];
    onSelect: (item: SlashMenuItem) => void;
    label: string;
}

export const InsertHandle: FC<Props> = ({ label, onSelect, items }) => {
    const [open, setOpen] = useState(false);

    const handleSelect = useCallback(
        (item: SlashMenuItem) => {
            setOpen(false);
            item.onSelect?.();
            onSelect(item);
        },
        [onSelect]
    );

    return (
        <>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                {label}
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput placeholder="Insert block…" />
                <CommandList>
                    <CommandEmpty>No matches found.</CommandEmpty>
                    <CommandGroup heading="Blocks">
                        {items.map((item) => (
                            <CommandItem
                                key={item.id}
                                onSelect={() => handleSelect(item)}
                                className="gap-2"
                            >
                                {item.icon ?? <Type className="size-4" />}
                                <span>{item.label}</span>
                                {item.description ? (
                                    <span className="text-xs text-muted-foreground">
                                        {item.description}
                                    </span>
                                ) : null}
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </CommandDialog>
        </>
    );
};
