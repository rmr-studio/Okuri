// components/custom-attributes/custom-attributes-builder.tsx
"use client";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";

// Types
export interface CustomAttributeField {
    id: string;
    key: string;
    value: any;
    type: "string" | "number" | "boolean" | "object";
    children?: CustomAttributeField[];
    isExpanded?: boolean;
    depth?: number;
}

interface Props<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
}

// Component
const CustomAttributesBuilder = <T extends FieldValues>({ form, name }: Props<T>) => {
    const [fields, setFields] = useState<CustomAttributeField[]>([]);
    const [nextId, setNextId] = useState(1);

    // Helpers (trimmed for brevity – reuse your current CRUD + conversion funcs)
    const generateId = () => {
        const id = nextId.toString();
        setNextId((prev) => prev + 1);
        return id;
    };

    const objectToFields = (obj: Record<string, any>, depth = 0): CustomAttributeField[] => {
        if (!obj || typeof obj !== "object") return [];
        return Object.entries(obj).map(([key, value]) => {
            const id = generateId();
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                return {
                    id,
                    key,
                    value: {},
                    type: "object",
                    children: objectToFields(value, depth + 1),
                    isExpanded: true,
                    depth,
                };
            } else if (typeof value === "number") {
                return { id, key, value, type: "number", depth };
            } else if (typeof value === "boolean") {
                return { id, key, value, type: "boolean", depth };
            } else {
                return { id, key, value: value ?? "", type: "string", depth };
            }
        });
    };

    const fieldsToObject = (fields: CustomAttributeField[]): Record<string, any> => {
        const result: Record<string, any> = {};
        fields.forEach((field) => {
            if (!field.key.trim()) return;
            if (field.type === "object" && field.children) {
                result[field.key] = fieldsToObject(field.children);
            } else {
                result[field.key] = field.value;
            }
        });
        return result;
    };

    const updateFormValue = (newFields: CustomAttributeField[]) => {
        const objectValue = fieldsToObject(newFields);
        form.setValue(name, objectValue);
    };

    // Init
    useEffect(() => {
        const existing = form.getValues(name);
        if (!existing) {
            form.setValue(name, {});
            return;
        }
        if (typeof existing === "object" && Object.keys(existing).length > 0) {
            const converted = objectToFields(existing, 0);
            setFields(converted);
        }
    }, [form, name]);

    // Minimal UI skeleton
    return (
        <FormField
            control={form.control}
            name={name}
            render={() => (
                <FormItem>
                    <FormControl>
                        <div>
                            {fields.length === 0 ? (
                                <Button
                                    type="button"
                                    onClick={() => {
                                        /* add new field */
                                    }}
                                >
                                    Add First Field
                                </Button>
                            ) : (
                                <>
                                    {fields.map((field) => (
                                        <div key={field.id} className="border p-2 rounded">
                                            <Input
                                                placeholder="Field name"
                                                value={field.key}
                                                onChange={(e) => {
                                                    const updated = fields.map((f) =>
                                                        f.id === field.id
                                                            ? { ...f, key: e.target.value }
                                                            : f
                                                    );
                                                    setFields(updated);
                                                    updateFormValue(updated);
                                                }}
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const updated = fields.filter(
                                                        (f) => f.id !== field.id
                                                    );
                                                    setFields(updated);
                                                    updateFormValue(updated);
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            /* add */
                                        }}
                                    >
                                        <Plus className="w-4 h-4 mr-2" /> Add Another
                                    </Button>
                                </>
                            )}
                        </div>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};

export default CustomAttributesBuilder;
