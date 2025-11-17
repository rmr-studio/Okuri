"use client";

import { DateTimePicker } from "@/components/ui/forms/date-picker/date-picker";
import { DateTimeInput } from "@/components/ui/forms/date-picker/date-picker-input";
import { FC, useMemo, useState } from "react";
import { BlockType } from "../../../interface/block.interface";
import { FilterSpec, getSortableFields } from "../../../util/list/list-sorting.util";

// Operator definitions by field type
const STRING_OPERATORS = [
    { value: "$eq", label: "equals", symbol: "=" },
    { value: "$ne", label: "not equals", symbol: "≠" },
    { value: "$contains", label: "contains", symbol: "~" },
] as const;

const NUMBER_OPERATORS = [
    { value: "$eq", label: "equals", symbol: "=" },
    { value: "$ne", label: "not equals", symbol: "≠" },
    { value: "$gt", label: "greater than", symbol: ">" },
    { value: "$gte", label: "greater or equal", symbol: "≥" },
    { value: "$lt", label: "less than", symbol: "<" },
    { value: "$lte", label: "less or equal", symbol: "≤" },
] as const;

const DATE_OPERATORS = NUMBER_OPERATORS; // Same as number operators

type FilterOperator = "$eq" | "$ne" | "$gt" | "$gte" | "$lt" | "$lte" | "$contains";

export interface ListFilterControlsProps {
    blockType: BlockType;
    currentFilters: FilterSpec[];
    filterLogic: "AND" | "OR";
    onFiltersChange: (filters: FilterSpec[]) => void;
}

export const ListFilterControls: FC<ListFilterControlsProps> = ({
    blockType,
    currentFilters,
    filterLogic,
    onFiltersChange,
}) => {
    const [showAddFilter, setShowAddFilter] = useState(false);
    const [selectedField, setSelectedField] = useState("");
    const [selectedOperator, setSelectedOperator] = useState<FilterOperator>("$eq");
    const [filterValue, setFilterValue] = useState("");
    const [dateValue, setDateValue] = useState<Date | undefined>(undefined);

    const sortableFields = getSortableFields(blockType);

    // Get the selected field's metadata
    const selectedFieldMeta = useMemo(() => {
        if (!selectedField) return null;
        const fieldKey = selectedField.replace("data.", "");
        return sortableFields.find((f) => f.key === fieldKey);
    }, [selectedField, sortableFields]);

    // Check if selected field is a date type
    const isDateField = useMemo(() => {
        return selectedFieldMeta?.format === "DATE" || selectedFieldMeta?.format === "DATETIME";
    }, [selectedFieldMeta]);

    // Check if selected field has predefined enum values
    const isEnumField = useMemo(() => {
        return Boolean(selectedFieldMeta?.enumValues && selectedFieldMeta.enumValues.length > 0);
    }, [selectedFieldMeta]);

    // Get available operators based on field type
    const availableOperators = useMemo(() => {
        if (!selectedFieldMeta) return STRING_OPERATORS;

        if (selectedFieldMeta.type === "NUMBER") {
            return NUMBER_OPERATORS;
        } else if (isDateField) {
            return DATE_OPERATORS;
        } else {
            return STRING_OPERATORS;
        }
    }, [selectedFieldMeta, isDateField]);

    if (sortableFields.length === 0) {
        return null;
    }

    const handleAddFilter = () => {
        // Validate input based on field type
        if (!selectedField) return;
        if (isDateField && !dateValue) return;
        if (isEnumField && !filterValue) return;
        if (!isDateField && !isEnumField && !filterValue) return;

        // Parse value based on field type
        let parsedValue: unknown;

        if (isDateField) {
            // Use ISO string for dates
            parsedValue = dateValue?.toISOString();
        } else if (selectedFieldMeta?.type === "NUMBER") {
            parsedValue = parseFloat(filterValue);
            if (isNaN(parsedValue as number)) {
                parsedValue = filterValue; // Keep as string if not a valid number
            }
        } else {
            parsedValue = filterValue;
        }

        // Build filter expression based on operator
        const newFilter: FilterSpec = {
            expr: {
                [selectedField]:
                    selectedOperator === "$eq"
                        ? parsedValue // Simple equality
                        : { [selectedOperator]: parsedValue }, // Operator-based
            },
        };

        onFiltersChange([...currentFilters, newFilter]);
        setSelectedField("");
        setSelectedOperator("$eq");
        setFilterValue("");
        setDateValue(undefined);
        setShowAddFilter(false);
    };

    const handleRemoveFilter = (index: number) => {
        const newFilters = currentFilters.filter((_, i) => i !== index);
        onFiltersChange(newFilters);
    };

    return (
        <div className="flex flex-col gap-2 text-sm">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Filters:</span>

                {currentFilters.length > 0 && (
                    <span className="text-xs text-muted-foreground">
                        ({filterLogic === "AND" ? "All must match" : "Any can match"})
                    </span>
                )}

                {!showAddFilter && (
                    <button
                        className="px-2 py-1 text-xs border rounded hover:bg-muted"
                        onClick={() => setShowAddFilter(true)}
                    >
                        + Add filter
                    </button>
                )}
            </div>

            {/* Existing filters */}
            {currentFilters.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {currentFilters.map((filter, index) => {
                        const [[field, condition]] = Object.entries(filter.expr);
                        const fieldMeta = sortableFields.find((f) => `data.${f.key}` === field);
                        const fieldName = fieldMeta?.name || field;

                        // Determine operator and value
                        let operator = "=";
                        let displayValue = condition;

                        if (typeof condition === "object" && condition !== null) {
                            const [op, val] = Object.entries(condition)[0];
                            const allOperators = [
                                ...STRING_OPERATORS,
                                ...NUMBER_OPERATORS.filter(
                                    (o) => !STRING_OPERATORS.find((s) => s.value === o.value)
                                ),
                            ];
                            operator = allOperators.find((o) => o.value === op)?.symbol || op;
                            displayValue = val;
                        }

                        // Format date values
                        let formattedValue = String(displayValue);
                        if (fieldMeta?.format === "DATE" || fieldMeta?.format === "DATETIME") {
                            try {
                                const date = new Date(displayValue as string);
                                if (fieldMeta.format === "DATE") {
                                    formattedValue = date.toLocaleDateString();
                                } else {
                                    formattedValue = date.toLocaleString();
                                }
                            } catch {
                                formattedValue = String(displayValue);
                            }
                        }

                        return (
                            <div
                                key={index}
                                className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                            >
                                <span>
                                    {fieldName} {operator} {formattedValue}
                                </span>
                                <button
                                    className="ml-1 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleRemoveFilter(index)}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add filter form */}
            {showAddFilter && (
                <div className="flex items-center gap-2 p-2 border rounded bg-muted/50">
                    <select
                        className="px-2 py-1 border rounded text-sm bg-background"
                        value={selectedField}
                        onChange={(e) => {
                            setSelectedField(e.target.value);
                            setSelectedOperator("$eq"); // Reset operator when field changes
                            setFilterValue(""); // Reset text value
                            setDateValue(undefined); // Reset date value
                        }}
                    >
                        <option value="">Select field...</option>
                        {sortableFields.map((field) => (
                            <option key={field.key} value={`data.${field.key}`}>
                                {field.name}
                            </option>
                        ))}
                    </select>

                    {/* Operator selector */}
                    {selectedField && (
                        <select
                            className="px-2 py-1 border rounded text-sm bg-background"
                            value={selectedOperator}
                            onChange={(e) => setSelectedOperator(e.target.value as FilterOperator)}
                        >
                            {availableOperators.map((op) => (
                                <option key={op.value} value={op.value}>
                                    {op.symbol} {op.label}
                                </option>
                            ))}
                        </select>
                    )}

                    {!selectedField && <span>=</span>}

                    {/* Date picker for date fields */}
                    {isDateField ? (
                        <DateTimePicker
                            value={dateValue}
                            onChange={setDateValue}
                            hideTime={selectedFieldMeta?.format === "DATE"}
                            clearable
                            classNames={{
                                trigger: "flex-1 text-sm h-8",
                            }}
                            renderTrigger={({ open, value, setOpen }) => (
                                <DateTimeInput
                                    value={value}
                                    onChange={(x) => !open && setDateValue(x)}
                                    format="dd/MM/yyyy"
                                    disabled={open}
                                    onCalendarClick={() => setOpen(!open)}
                                />
                            )}
                        />
                    ) : isEnumField ? (
                        /* Dropdown for enum fields */
                        <select
                            className="px-2 py-1 border rounded text-sm bg-background flex-1"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                        >
                            <option value="">Select value...</option>
                            {selectedFieldMeta?.enumValues?.map((enumValue) => (
                                <option key={enumValue} value={enumValue}>
                                    {enumValue}
                                </option>
                            ))}
                        </select>
                    ) : (
                        /* Text/number input for other fields */
                        <input
                            type={selectedFieldMeta?.type === "NUMBER" ? "number" : "text"}
                            className="px-2 py-1 border rounded text-sm bg-background flex-1"
                            placeholder="Value..."
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddFilter();
                                if (e.key === "Escape") {
                                    setShowAddFilter(false);
                                    setSelectedField("");
                                    setSelectedOperator("$eq");
                                    setFilterValue("");
                                    setDateValue(undefined);
                                }
                            }}
                        />
                    )}

                    <button
                        className="px-2 py-1 text-xs border rounded bg-background hover:bg-muted"
                        onClick={handleAddFilter}
                        disabled={
                            !selectedField ||
                            (isDateField ? !dateValue : !filterValue)
                        }
                    >
                        Add
                    </button>

                    <button
                        className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setShowAddFilter(false);
                            setSelectedField("");
                            setSelectedOperator("$eq");
                            setFilterValue("");
                            setDateValue(undefined);
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};
