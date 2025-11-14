"use client";

import { FC } from "react";
import { FormWidgetProps } from "../form-widget.types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/util/utils";

export const ToggleSwitchWidget: FC<FormWidgetProps<boolean>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    errors,
    disabled,
}) => {
    const hasErrors = errors && errors.length > 0;

    return (
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <Switch
                    id={label}
                    checked={value || false}
                    onCheckedChange={(checked) => {
                        onChange(checked);
                        onBlur?.();
                    }}
                    disabled={disabled}
                />
                <Label
                    htmlFor={label}
                    className={cn("cursor-pointer", hasErrors && "text-destructive")}
                >
                    {label}
                </Label>
            </div>
            {description && <p className="text-sm text-muted-foreground ml-12">{description}</p>}
            {hasErrors && (
                <div className="space-y-1 ml-12">
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
