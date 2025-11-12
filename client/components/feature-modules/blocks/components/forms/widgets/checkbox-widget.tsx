"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/util/utils";
import { FC } from "react";
import { FormWidgetProps } from "../form-widget.types";

export const CheckboxWidget: FC<FormWidgetProps<boolean>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    errors,
    disabled,
}) => {
    const hasErrors = errors && errors.length > 0;
    // Sanitize label for use as HTML id
    const sanitizedId = label.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <Checkbox
                    id={sanitizedId}
                    checked={value || false}
                    onCheckedChange={(checked) => {
                        onChange(!!checked);
                        onBlur?.();
                    }}
                    disabled={disabled}
                    className={cn(hasErrors && "border-destructive")}
                />
                <Label
                    htmlFor={sanitizedId}
                    className={cn("cursor-pointer", hasErrors && "text-destructive")}
                >
                    {label}
                </Label>
            </div>
            {description && <p className="text-sm text-muted-foreground ml-6">{description}</p>}
            {hasErrors && (
                <div className="space-y-1 ml-6">
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
