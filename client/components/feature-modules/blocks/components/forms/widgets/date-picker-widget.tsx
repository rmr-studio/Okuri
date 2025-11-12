"use client";

import { DateTimePicker } from "@/components/ui/forms/date-picker/date-picker";
import { DateTimeInput } from "@/components/ui/forms/date-picker/date-picker-input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/util/utils";
import { FC, useState } from "react";
import { FormWidgetProps } from "../form-widget.types";

export const DatePickerWidget: FC<FormWidgetProps<string>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    placeholder,
    errors,
    disabled,
}) => {
    const [open, setOpen] = useState(false);
    const hasErrors = errors && errors.length > 0;

    const date = value ? new Date(value) : undefined;

    const handleChange = (date: Date | undefined) => {
        if (date) {
            onChange(date.toISOString());
        } else {
            onChange("");
        }
        onBlur?.();
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={label} className={cn(hasErrors && "text-destructive")}>
                {label}
            </Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <DateTimePicker
                value={date}
                onChange={handleChange}
                modal={true}
                hideTime
                // min={minDate}
                // max={maxDate}
                // exitOnClick={exitOnClick}
                clearable
                renderTrigger={({ open, value, setOpen }) => (
                    <DateTimeInput
                        value={value}
                        onChange={(x) => !open && handleChange(x)}
                        format="dd/MM/yyyy"
                        disabled={open}
                        onCalendarClick={() => setOpen(!open)}
                    />
                )}
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
