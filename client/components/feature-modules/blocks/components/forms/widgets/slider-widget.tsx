"use client";

import { FC } from "react";
import { FormWidgetProps } from "../form-widget.types";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/util/utils";

export const SliderWidget: FC<FormWidgetProps<number>> = ({
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
            <div className="flex items-center justify-between">
                <Label htmlFor={label} className={cn(hasErrors && "text-destructive")}>
                    {label}
                </Label>
                <span className="text-sm text-muted-foreground">{value || 0}</span>
            </div>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <Slider
                id={label}
                value={[value || 0]}
                onValueChange={([newValue]) => onChange(newValue)}
                onValueCommit={() => onBlur?.()}
                disabled={disabled}
                min={0}
                max={100}
                step={1}
                className={cn(hasErrors && "accent-destructive")}
            />
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
