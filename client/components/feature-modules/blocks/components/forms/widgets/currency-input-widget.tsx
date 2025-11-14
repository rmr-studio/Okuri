"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/util/utils";
import { FC, useState } from "react";
import { FormWidgetProps } from "../form-widget.types";

export const CurrencyInputWidget: FC<FormWidgetProps<number>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    placeholder,
    errors,
    disabled,
}) => {
    const hasErrors = errors && errors.length > 0;
    const [input, setInput] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let cleaned = e.target.value.replace(/[^0-9.]/g, "");
        // Allow only one decimal point
        const parts = cleaned.split(".");
        if (parts.length > 2) {
            cleaned = parts[0] + "." + parts.slice(1).join("");
        }
        setInput(cleaned);
    };

    const handleBlur = () => {
        const parsedValue = input ? parseFloat(input) : 0;
        onChange(parsedValue);
        setInput("");
        onBlur?.();
    };

    const displayValue = input || (value ? value.toFixed(2) : "");

    return (
        <div className="space-y-2">
            <Label htmlFor={label} className={cn(hasErrors && "text-destructive")}>
                {label}
            </Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                </span>
                <Input
                    id={label}
                    type="text"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder || "0.00"}
                    disabled={disabled}
                    className={cn(
                        "pl-7",
                        hasErrors && "border-destructive focus-visible:ring-destructive"
                    )}
                />
            </div>
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
