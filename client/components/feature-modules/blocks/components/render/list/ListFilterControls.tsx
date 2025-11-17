"use client";

import { FC, useState } from "react";
import { BlockType } from "../../../interface/block.interface";
import { FilterSpec, getSortableFields } from "../../../util/list/list-sorting.util";

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
    const [filterValue, setFilterValue] = useState("");

    const sortableFields = getSortableFields(blockType);

    if (sortableFields.length === 0) {
        return null;
    }

    const handleAddFilter = () => {
        if (!selectedField || !filterValue) return;

        const newFilter: FilterSpec = {
            expr: {
                [selectedField]: filterValue,
            },
        };

        onFiltersChange([...currentFilters, newFilter]);
        setSelectedField("");
        setFilterValue("");
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
                        const [[field, value]] = Object.entries(filter.expr);
                        const fieldName =
                            sortableFields.find((f) => `data.${f.key}` === field)?.name || field;

                        return (
                            <div
                                key={index}
                                className="flex items-center gap-1 px-2 py-1 bg-muted rounded text-xs"
                            >
                                <span>
                                    {fieldName} = {String(value)}
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
                        onChange={(e) => setSelectedField(e.target.value)}
                    >
                        <option value="">Select field...</option>
                        {sortableFields.map((field) => (
                            <option key={field.key} value={`data.${field.key}`}>
                                {field.name}
                            </option>
                        ))}
                    </select>

                    <span>=</span>

                    <input
                        type="text"
                        className="px-2 py-1 border rounded text-sm bg-background"
                        placeholder="Value..."
                        value={filterValue}
                        onChange={(e) => setFilterValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddFilter();
                            if (e.key === "Escape") {
                                setShowAddFilter(false);
                                setSelectedField("");
                                setFilterValue("");
                            }
                        }}
                    />

                    <button
                        className="px-2 py-1 text-xs border rounded bg-background hover:bg-muted"
                        onClick={handleAddFilter}
                        disabled={!selectedField || !filterValue}
                    >
                        Add
                    </button>

                    <button
                        className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => {
                            setShowAddFilter(false);
                            setSelectedField("");
                            setFilterValue("");
                        }}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};
