"use client";

import { FC, useState } from "react";
import { FormWidgetProps } from "../form-widget.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/util/utils";

export const DropdownWidget: FC<FormWidgetProps<string>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    placeholder,
    errors,
    disabled,
    options = [],
}) => {
    const [open, setOpen] = useState(false);
    const hasErrors = errors && errors.length > 0;

    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <div className="space-y-2">
            <Label htmlFor={label} className={cn(hasErrors && "text-destructive")}>
                {label}
            </Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        disabled={disabled}
                        className={cn(
                            "w-full justify-between",
                            !value && "text-muted-foreground",
                            hasErrors && "border-destructive"
                        )}
                    >
                        {selectedOption?.label || placeholder || "Select option..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search..." />
                        <CommandEmpty>No option found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.value}
                                    onSelect={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                        onBlur?.();
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
            {hasErrors && (
                <div className="space-y-1">
                    {errors.map((error, idx) => (
                        <p key={idx} className="text-sm text-destructive">
                            {error}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};
