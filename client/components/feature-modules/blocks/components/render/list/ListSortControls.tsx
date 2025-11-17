"use client";

import { FC } from "react";
import { BlockType } from "../../../interface/block.interface";
import { getSortableFields, SortSpec } from "../../../util/list/list-sorting.util";

export interface ListSortControlsProps {
    blockType: BlockType;
    currentSort: SortSpec | undefined;
    onSortChange: (sort: SortSpec | undefined) => void;
}

export const ListSortControls: FC<ListSortControlsProps> = ({
    blockType,
    currentSort,
    onSortChange,
}) => {
    const sortableFields = getSortableFields(blockType);

    if (sortableFields.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Sort by:</span>

            <select
                className="px-2 py-1 border rounded text-sm"
                value={currentSort?.by || ""}
                onChange={(e) => {
                    if (!e.target.value) {
                        onSortChange(undefined);
                    } else {
                        onSortChange({
                            by: e.target.value,
                            dir: currentSort?.dir || "ASC",
                        });
                    }
                }}
            >
                <option value="">None</option>
                {sortableFields.map((field) => (
                    <option key={field.key} value={`data.${field.key}`}>
                        {field.name}
                    </option>
                ))}
            </select>

            {currentSort && (
                <button
                    className="px-2 py-1 border rounded text-sm hover:bg-muted"
                    onClick={() =>
                        onSortChange({
                            ...currentSort,
                            dir: currentSort.dir === "ASC" ? "DESC" : "ASC",
                        })
                    }
                    title={currentSort.dir === "ASC" ? "Sort descending" : "Sort ascending"}
                >
                    {currentSort.dir === "ASC" ? "↑ A-Z" : "↓ Z-A"}
                </button>
            )}

            {currentSort && (
                <button
                    className="px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => onSortChange(undefined)}
                >
                    Clear
                </button>
            )}
        </div>
    );
};
