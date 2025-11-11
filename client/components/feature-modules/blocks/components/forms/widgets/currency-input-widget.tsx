"use client";

import { FC } from "react";
import { FormWidgetProps } from "../form-widget.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/util/utils";

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        // Remove non-numeric characters except decimal point
        const numericValue = rawValue.replace(/[^0-9.]/g, "");
        const parsedValue = numericValue ? parseFloat(numericValue) : 0;
        onChange(parsedValue);
    };

    const displayValue = value ? value.toFixed(2) : "";

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
                    onBlur={onBlur}
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
