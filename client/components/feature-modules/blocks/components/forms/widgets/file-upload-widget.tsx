"use client";

import { FC, useRef } from "react";
import { FormWidgetProps } from "../form-widget.types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/util/utils";

export const FileUploadWidget: FC<FormWidgetProps<string>> = ({
    value,
    onChange,
    onBlur,
    label,
    description,
    errors,
    disabled,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasErrors = errors && errors.length > 0;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // For now, store the file name. In production, you'd upload to a server
            // and store the URL
            onChange(file.name);
            onBlur?.();
        }
    };

    const handleClear = () => {
        onChange("");
        if (inputRef.current) {
            inputRef.current.value = "";
        }
        onBlur?.();
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={label} className={cn(hasErrors && "text-destructive")}>
                {label}
            </Label>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    id={label}
                    type="file"
                    onChange={handleFileChange}
                    disabled={disabled}
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                    disabled={disabled}
                    className={cn("flex-1", hasErrors && "border-destructive")}
                >
                    <Upload className="mr-2 h-4 w-4" />
                    {value || "Choose file"}
                </Button>
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleClear}
                        disabled={disabled}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
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
