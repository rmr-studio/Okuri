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
    compact?: boolean;
}

export const InsertHandle: FC<Props> = ({ label, onSelect, items, compact }) => {
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
            <Button
                variant={compact ? "ghost" : "outline"}
                size={compact ? "icon" : "sm"}
                className={compact ? "rounded-full" : "gap-1"}
                onClick={() => setOpen(true)}
                aria-label={label}
            >
                <Plus className="size-4" />
                {compact ? <span className="sr-only">{label}</span> : label}
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
