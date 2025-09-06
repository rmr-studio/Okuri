import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { FC, useState } from "react";
import { Control, UseFormSetValue, useWatch } from "react-hook-form";
import { z } from "zod";
import { Button } from "../../button";
import { FormControl, FormField, FormItem, FormMessage } from "../../form";
import { Input } from "../../input";
import { TextSeparator } from "../../text-separator";

// Schema for custom attributes - allows any nested object structure
export const CustomAttributesFormSchema: z.ZodType<Record<string, any>> =
    z.lazy(() =>
        z.record(
            z.union([
                z.string(),
                z.number(),
                z.boolean(),
                z.lazy(() => CustomAttributesFormSchema),
            ])
        )
    );

export type CustomAttributesForm = z.infer<typeof CustomAttributesFormSchema>;

interface CustomAttributeField {
    key: string;
    value: any;
    type: "string" | "number" | "boolean" | "object";
    children?: CustomAttributeField[];
    isExpanded?: boolean;
}

interface Props {
    control: Control<CustomAttributesForm>;
    setValue: UseFormSetValue<CustomAttributesForm>;
}

export const CustomAttributesForm: FC<Props> = ({ control, setValue }) => {
    const [fields, setFields] = useState<CustomAttributeField[]>([]);
    const watchedValues = useWatch({ control, name: "customAttributes" });

    const addField = () => {
        const newField: CustomAttributeField = {
            key: "",
            value: "",
            type: "string",
            children: [],
            isExpanded: false,
        };
        setFields([...fields, newField]);
    };

    const removeField = (index: number) => {
        const newFields = fields.filter((_, i) => i !== index);
        setFields(newFields);
        updateFormValue(newFields);
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

    const addChildField = (parentIndex: number) => {
        const newFields = [...fields];
        if (!newFields[parentIndex].children) {
            newFields[parentIndex].children = [];
        }
        newFields[parentIndex].children!.push({
            key: "",
            value: "",
            type: "string",
        });
        setFields(newFields);
        updateFormValue(newFields);
    };

    const removeChildField = (parentIndex: number, childIndex: number) => {
        const newFields = [...fields];
        newFields[parentIndex].children!.splice(childIndex, 1);
        setFields(newFields);
        updateFormValue(newFields);
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

    const updateFormValue = (newFields: CustomAttributeField[]) => {
        const formValue: Record<string, any> = {};

        newFields.forEach((field) => {
            if (field.key) {
                if (
                    field.type === "object" &&
                    field.children &&
                    field.children.length > 0
                ) {
                    const childObj: Record<string, any> = {};
                    field.children.forEach((child) => {
                        if (child.key) {
                            childObj[child.key] = child.value;
                        }
                    });
                    formValue[field.key] = childObj;
                } else {
                    formValue[field.key] = field.value;
                }
            }
        });

        setValue("customAttributes", formValue);
    };

    const renderField = (
        field: CustomAttributeField,
        index: number,
        isChild = false,
        parentIndex?: number
    ) => {
        const isObject = field.type === "object";

        return (
            <div
                key={index}
                className={`border rounded-lg p-4 ${
                    isChild ? "ml-4 bg-gray-50" : "bg-white"
                }`}
            >
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex-1 grid grid-cols-3 gap-2">
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
                            <option value="string">String</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="object">Object</option>
                        </select>
                        {field.type !== "boolean" &&
                            field.type !== "object" && (
                                <Input
                                    placeholder="Value"
                                    type={
                                        field.type === "number"
                                            ? "number"
                                            : "text"
                                    }
                                    value={field.value}
                                    onChange={(e) => {
                                        const newValue =
                                            field.type === "number"
                                                ? Number(e.target.value)
                                                : e.target.value;
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
                            )}
                        {field.type === "boolean" && (
                            <select
                                className="border rounded px-3 py-2"
                                value={field.value.toString()}
                                onChange={(e) => {
                                    const newValue = e.target.value === "true";
                                    if (isChild && parentIndex !== undefined) {
                                        updateChildField(parentIndex, index, {
                                            value: newValue,
                                        });
                                    } else {
                                        updateField(index, { value: newValue });
                                    }
                                }}
                            >
                                <option value="true">True</option>
                                <option value="false">False</option>
                            </select>
                        )}
                    </div>
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
                                Object Properties
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
                                Add Property
                            </Button>
                        </div>

                        {field.isExpanded && field.children && (
                            <div className="ml-4 space-y-2">
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

    return (
        <section>
            <section className="my-4 flex flex-col">
                <TextSeparator>
                    <span className="text-[1rem] leading-1 font-semibold">
                        Custom Attributes
                    </span>
                </TextSeparator>
                <p className="text-sm text-gray-600 mb-4">
                    Add custom fields and values specific to your organisation.
                    You can create nested objects for complex data structures.
                </p>

                <FormField
                    control={control}
                    name="customAttributes"
                    render={({ field }) => (
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
                                        Add Custom Field
                                    </Button>
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </section>
        </section>
    );
};
