"use client";

import { FC, useRef, useEffect } from "react";
import { get } from "lodash";
import { BlockType } from "../../interface/block.interface";
import { useBlockEdit } from "../../context/block-edit-provider";
import { formWidgetRegistry } from "./form-widget.registry";
import { cn } from "@/lib/util/utils";

interface BlockFormProps {
    blockId: string;
    blockType: BlockType;
    mode: "inline" | "drawer";
}

export const BlockForm: FC<BlockFormProps> = ({ blockId, blockType, mode }) => {
    const { getDraft, updateDraft, validateField } = useBlockEdit();
    const formRef = useRef<HTMLDivElement>(null);
    const draft = getDraft(blockId);

    const { form } = blockType.display;

    // Focus first input when entering inline edit mode
    useEffect(() => {
        if (mode === "inline" && formRef.current) {
            const firstInput = formRef.current.querySelector<HTMLElement>(
                'input:not([type="hidden"]), textarea, select'
            );
            if (firstInput) {
                firstInput.focus();
            }
        }
    }, [mode]);

    // Tab navigation between fields and blocks
    useEffect(() => {
        const formElement = formRef.current;
        if (!formElement) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Tab") return;

            const focusableElements = Array.from(
                formElement.querySelectorAll<HTMLElement>(
                    'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
                )
            );

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) {
                // Shift+Tab on first element: navigate to previous block
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    window.dispatchEvent(
                        new KeyboardEvent("keydown", {
                            key: "ArrowUp",
                            bubbles: true,
                        })
                    );
                }
            } else {
                // Tab on last element: navigate to next block
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    window.dispatchEvent(
                        new KeyboardEvent("keydown", {
                            key: "ArrowDown",
                            bubbles: true,
                        })
                    );
                }
            }
        };

        formElement.addEventListener("keydown", handleKeyDown);
        return () => formElement.removeEventListener("keydown", handleKeyDown);
    }, []);

    if (!draft) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                No draft data available for this block
            </div>
        );
    }

    if (!form || !form.fields || Object.keys(form.fields).length === 0) {
        return (
            <div className="p-4 text-sm text-muted-foreground">
                No form configuration defined for this block type
            </div>
        );
    }

    return (
        <div
            ref={formRef}
            className={cn(
                "space-y-4",
                mode === "inline" && "p-4 bg-background rounded-sm",
                mode === "drawer" && "space-y-3"
            )}
        >
            {Object.entries(form.fields).map(([fieldPath, fieldConfig]) => {
                const widgetMeta = formWidgetRegistry[fieldConfig.type];

                if (!widgetMeta) {
                    console.warn(`Unknown widget type: ${fieldConfig.type}`);
                    return (
                        <div key={fieldPath} className="p-2 border border-destructive rounded">
                            <p className="text-sm text-destructive">
                                Unknown widget type: {fieldConfig.type}
                            </p>
                        </div>
                    );
                }

                const Widget = widgetMeta.component;
                const value = get(draft, fieldPath);
                const errors = validateField(blockId, fieldPath);

                return (
                    <div key={fieldPath}>
                        <Widget
                            value={value !== undefined ? value : widgetMeta.defaultValue}
                            onChange={(newValue) => updateDraft(blockId, fieldPath, newValue)}
                            onBlur={() => validateField(blockId, fieldPath)}
                            label={fieldConfig.label}
                            description={fieldConfig.description}
                            tooltip={fieldConfig.tooltip}
                            placeholder={fieldConfig.placeholder}
                            options={fieldConfig.options}
                            errors={errors}
                        />
                    </div>
                );
            })}
        </div>
    );
};
