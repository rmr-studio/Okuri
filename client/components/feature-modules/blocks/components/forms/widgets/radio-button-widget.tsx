"use client";

import { FC } from "react";
import { FormWidgetProps } from "../form-widget.types";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/util/utils";

export const RadioButtonWidget: FC<FormWidgetProps<string>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    errors,
    disabled,
    options = [],
}) => {
    const hasErrors = errors && errors.length > 0;

    return (
        <div className="space-y-2">
            <Label className={cn(hasErrors && "text-destructive")}>{label}</Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <RadioGroup
                value={value || ""}
                onValueChange={(newValue) => {
                    onChange(newValue);
                    onBlur?.();
                }}
                disabled={disabled}
            >
                {options.map((option) => (
                    <div key={option.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.value} id={`${label}-${option.value}`} />
                        <Label
                            htmlFor={`${label}-${option.value}`}
                            className="cursor-pointer font-normal"
                        >
                            {option.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
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
