"use client";

import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/util/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

// Build currency data
const getCurrencyData = () => {
    const codes = Intl.supportedValuesOf
        ? Intl.supportedValuesOf("currency")
        : ["USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD"];

    return codes.map((code) => {
        const formatter = new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: code,
        });
        const parts = formatter.formatToParts(1);

        const symbol = parts.find((p) => p.type === "currency")?.value ?? code;

        // Guess country by display name
        const displayName = new Intl.DisplayNames([navigator.language], {
            type: "currency",
        }).of(code);

        return {
            code,
            country: displayName ?? code,
            symbol,
        };
    });
};

const currencies = getCurrencyData();

export function CurrencyComboBox() {
    const [open, setOpen] = React.useState(false);
    const [selected, setSelected] = React.useState<(typeof currencies)[0]>();

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[280px] justify-between"
                >
                    {selected ? (
                        <span>
                            {selected.country} – {selected.code} ({selected.symbol})
                        </span>
                    ) : (
                        "Select currency..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0">
                <Command>
                    <CommandInput placeholder="Search currency or country..." />
                    <CommandEmpty>No currency found.</CommandEmpty>
                    <CommandGroup>
                        {currencies.map((currency) => (
                            <CommandItem
                                key={currency.code}
                                value={`${currency.code} ${currency.country}`}
                                onSelect={() => {
                                    setSelected(currency);
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selected?.code === currency.code
                                            ? "opacity-100"
                                            : "opacity-0"
                                    )}
                                />
                                {currency.country} – {currency.code} ({currency.symbol})
                            </CommandItem>
                        ))}
                    </CommandGroup>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
