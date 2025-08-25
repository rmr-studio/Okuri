import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TextSeparator } from "@/components/ui/text-separator";
import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { toast } from "sonner";
import { OrganisationStepFormProps } from "../OrganisationForm";

interface CustomAttributeField {
    key: string;
    value: any;
    type: "string" | "number" | "boolean" | "object";
    children?: CustomAttributeField[];
    isExpanded?: boolean;
}

const OrganisationAttributesForm: FC<OrganisationStepFormProps> = ({
    form,
    handleFormSubmit,
    handlePreviousPage,
}) => {
    const [fields, setFields] = useState<CustomAttributeField[]>([]);

    // ---------- HELPERS ----------
    // Pre-populate if form already has customAttributes
    useEffect(() => {
        const existing = form.getValues("customAttributes");
        if (existing && Object.keys(existing).length > 0) {
            setFields(objectToFields(existing));
        }
    }, []);

    const objectToFields = (obj: Record<string, any>): CustomAttributeField[] =>
        Object.entries(obj).map(([key, value]) => {
            if (
                typeof value === "object" &&
                value !== null &&
                !Array.isArray(value)
            ) {
                return {
                    key,
                    value: {},
                    type: "object",
                    children: objectToFields(value),
                    isExpanded: true,
                };
            } else if (typeof value === "number") {
                return { key, value, type: "number" };
            } else if (typeof value === "boolean") {
                return { key, value, type: "boolean" };
            } else {
                return { key, value: value ?? "", type: "string" };
            }
        });

    const fieldsToObject = (f: CustomAttributeField[]): Record<string, any> => {
        const result: Record<string, any> = {};
        f.forEach((field) => {
            if (!field.key) return;
            if (field.type === "object" && field.children) {
                result[field.key] = fieldsToObject(field.children);
            } else {
                result[field.key] = field.value;
            }
        });
        return result;
    };

    const updateFormValue = (newFields: CustomAttributeField[]) => {
        form.setValue("customAttributes", fieldsToObject(newFields));
    };

    // ---------- CRUD ----------
    const addField = () => {
        const newFields = [
            ...fields,
            {
                key: "",
                value: "",
                type: "string",
                children: [],
                isExpanded: false,
            },
        ];
        setFields(newFields);
        updateFormValue(newFields); // <-- this makes it visible
    };

    const updateField = (
        index: number,
        field: Partial<CustomAttributeField>
    ) => {
        const newFields = fields.map((f, i) =>
            i === index ? { ...f, ...field } : f
        );
        setFields(newFields);
        updateFormValue(newFields);
    };

    const removeField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
        updateFormValue(newFields);
    };

    const addChildField = (parentIndex: number) => {
        const newFields = [...fields];
        if (!newFields[parentIndex].children)
            newFields[parentIndex].children = [];
        newFields[parentIndex].children!.push({
            key: "",
            value: "",
            type: "string",
            isExpanded: false,
        });
        setFields(newFields);
        updateFormValue(newFields); // <-- add this
    };
    const updateChildField = (
        parentIndex: number,
        childIndex: number,
        field: Partial<CustomAttributeField>
    ) => {
        const newFields = [...fields];
        newFields[parentIndex].children![childIndex] = {
            ...newFields[parentIndex].children![childIndex],
            ...field,
        };
        setFields(newFields);
        updateFormValue(newFields);
    };

    const removeChildField = (parentIndex: number, childIndex: number) => {
        const newFields = [...fields];
        newFields[parentIndex].children!.splice(childIndex, 1);
        setFields(newFields);
        updateFormValue(newFields);
    };

    // ---------- RENDER ----------
    const renderField = (
        field: CustomAttributeField,
        index: number,
        isChild = false,
        parentIndex?: number
    ) => {
        const isObject = field.type === "object";

        return (
            <div key={index} className="border rounded-lg p-3 bg-card">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                        {/* Field name */}
                        <Input
                            placeholder="Field name"
                            value={field.key}
                            onChange={(e) => {
                                if (isChild && parentIndex !== undefined) {
                                    updateChildField(parentIndex, index, {
                                        key: e.target.value,
                                    });
                                } else {
                                    updateField(index, { key: e.target.value });
                                }
                            }}
                        />

                        {/* Type select (user-friendly labels) */}
                        <select
                            className="border rounded px-3 py-2"
                            value={field.type}
                            onChange={(e) => {
                                const newType = e.target
                                    .value as CustomAttributeField["type"];
                                const newValue =
                                    newType === "boolean"
                                        ? false
                                        : newType === "number"
                                        ? 0
                                        : newType === "object"
                                        ? {}
                                        : "";
                                if (isChild && parentIndex !== undefined) {
                                    updateChildField(parentIndex, index, {
                                        type: newType,
                                        value: newValue,
                                    });
                                } else {
                                    updateField(index, {
                                        type: newType,
                                        value: newValue,
                                    });
                                }
                            }}
                        >
                            <option value="string">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Yes / No</option>
                            <option value="object">Group of Fields</option>
                        </select>

                        {/* Value input (depending on type) */}
                        {field.type === "string" && (
                            <Input
                                placeholder="Text value"
                                value={field.value}
                                onChange={(e) => {
                                    const newValue = e.target.value;
                                    if (isChild && parentIndex !== undefined) {
                                        updateChildField(parentIndex, index, {
                                            value: newValue,
                                        });
                                    } else {
                                        updateField(index, { value: newValue });
                                    }
                                }}
                            />
                        )}

                        {field.type === "number" && (
                            <Input
                                type="number"
                                placeholder="0"
                                value={field.value}
                                onChange={(e) => {
                                    const newValue = Number(e.target.value);
                                    if (isChild && parentIndex !== undefined) {
                                        updateChildField(parentIndex, index, {
                                            value: newValue,
                                        });
                                    } else {
                                        updateField(index, { value: newValue });
                                    }
                                }}
                            />
                        )}

                        {field.type === "boolean" && (
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={(e) => {
                                        const newValue = e.target.checked;
                                        if (
                                            isChild &&
                                            parentIndex !== undefined
                                        ) {
                                            updateChildField(
                                                parentIndex,
                                                index,
                                                { value: newValue }
                                            );
                                        } else {
                                            updateField(index, {
                                                value: newValue,
                                            });
                                        }
                                    }}
                                />
                                <span>Enabled</span>
                            </label>
                        )}
                    </div>

                    {/* Remove button */}
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                            if (isChild && parentIndex !== undefined) {
                                removeChildField(parentIndex, index);
                            } else {
                                removeField(index);
                            }
                        }}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                {/* Nested fields for object */}
                {isObject && (
                    <div className="mt-3">
                        <div className="flex items-center gap-2 mb-2">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (isChild && parentIndex !== undefined) {
                                        updateChildField(parentIndex, index, {
                                            isExpanded: !field.isExpanded,
                                        });
                                    } else {
                                        updateField(index, {
                                            isExpanded: !field.isExpanded,
                                        });
                                    }
                                }}
                            >
                                {field.isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                ) : (
                                    <ChevronRight className="w-4 h-4" />
                                )}
                            </Button>
                            <span className="text-sm font-medium">
                                Fields in this group
                            </span>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    addChildField(
                                        isChild ? parentIndex! : index
                                    )
                                }
                            >
                                <Plus className="w-4 h-4" />
                                Add Field
                            </Button>
                        </div>

                        {field.isExpanded && field.children && (
                            <div className="ml-6 space-y-2">
                                {field.children.map((child, childIndex) =>
                                    renderField(
                                        child,
                                        childIndex,
                                        true,
                                        isChild ? parentIndex : index
                                    )
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    // ---------- SUBMIT ----------
    const onBack = () => handlePreviousPage("billing");

    const onSubmit = async () => {
        const isValid = await form.trigger();
        if (!isValid) {
            toast.error("Please fix validation errors before submitting");
            return;
        }
        const formValues = form.getValues();
        await handleFormSubmit(formValues);
    };

    // ---------- UI ----------
    return (
        <>
            <CardContent className="pb-8">
                <div className="flex flex-col space-y-6">
                    <div className="mt-6">
                        <TextSeparator>
                            <span className="text-[1rem] font-semibold">
                                Additional Organisation Info (Optional)
                            </span>
                        </TextSeparator>
                        <p className="text-sm text-gray-600 mb-4">
                            Add custom details about your organisation. You can
                            create text, numbers, yes/no options, or groups of
                            fields for complex structures.
                        </p>

                        <FormField
                            control={form.control}
                            name="customAttributes"
                            render={() => (
                                <FormItem>
                                    <FormControl>
                                        <div className="space-y-3">
                                            {fields.map((field, index) =>
                                                renderField(field, index)
                                            )}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={addField}
                                                className="w-full"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Field
                                            </Button>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* JSON Preview */}
                        {fields.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-medium mb-2">
                                    Preview
                                </h3>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-x-auto">
                                    {JSON.stringify(
                                        fieldsToObject(fields),
                                        null,
                                        2
                                    )}
                                </pre>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

            <CardFooter className="flex justify-between mt-4 py-1 border-t">
                <Button
                    type="button"
                    onClick={onBack}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer"
                >
                    Previous Page
                </Button>
                <Button
                    type="button"
                    size="sm"
                    className="cursor-pointer"
                    onClick={onSubmit}
                >
                    Create Organisation
                </Button>
            </CardFooter>
        </>
    );
};

export default OrganisationAttributesForm;
