import {
    BlockListConfiguration,
    BlockNode,
    BlockType,
    isContentMetadata,
    isContentNode,
} from "../../interface/block.interface";

export interface SortableField {
    key: string;
    name: string;
    type: string;
    format?: string;
    enumValues?: string[]; // Predefined values for dropdown selection
}

export interface SortSpec {
    by: string;
    dir: "ASC" | "DESC";
}

export interface FilterSpec {
    expr: {
        [key: string]: unknown;
    };
}

/**
 * Detect if a list contains only one block type (uni-block list)
 */
export function isUniBlockList(children: BlockNode[]): boolean {
    if (children.length === 0) return true;

    const types = new Set(children.map((child) => child.block.type.key));
    return types.size === 1;
}

/**
 * Get the uniform block type key if list is uni-block, otherwise null
 */
export function getUniformBlockType(children: BlockNode[]): string | null {
    if (!isUniBlockList(children)) return null;
    return children[0]?.block.type.key || null;
}

/**
 * Get list of fields that can be sorted from a block type's schema
 */
export function getSortableFields(blockType: BlockType): SortableField[] {
    const properties = blockType.schema.properties || {};
    const formFields = blockType.display?.form?.fields || {};

    return Object.entries(properties)
        .filter(([, schema]) => {
            // Only include fields that can be meaningfully sorted
            return (
                schema.type === "STRING" ||
                schema.type === "NUMBER" ||
                schema.format === "DATE" ||
                schema.format === "DATETIME"
            );
        })
        .map(([key, schema]) => {
            // Extract enum values from schema first
            let enumValues =
                (schema as any).enum ||
                (schema as any).enumValues ||
                (schema as any).allowedValues ||
                (schema as any).options;

            // If not in schema, check form field definitions
            if (!enumValues) {
                const fieldPath = `data.${key}`;
                const formField = formFields[fieldPath];

                if (formField && (formField as any).type === "DROPDOWN") {
                    // Extract values from dropdown options
                    const options = (formField as any).options;
                    if (Array.isArray(options)) {
                        enumValues = options.map((opt: any) => {
                            // Support both string values and {label, value} objects
                            return typeof opt === "string" ? opt : opt.value;
                        });
                    }
                }
            }

            return {
                key,
                name: schema.name || key,
                type: schema.type,
                format: schema.format,
                enumValues: Array.isArray(enumValues) ? enumValues : undefined,
            };
        });
}

/**
 * Extract a field value from a block node using a field path
 * Supports paths like "data.fieldName" or "$.data.fieldName"
 */
function getFieldValue(node: BlockNode, fieldPath: string): unknown {
    if (!isContentNode(node) || !isContentMetadata(node.block.payload)) {
        return null;
    }

    // Parse path like "data.dueDate" or "$.data.dueDate"
    const path = fieldPath.replace(/^\$\./, "").split(".");

    let value: any = node.block.payload;
    for (const key of path) {
        value = value?.[key];
        if (value === undefined) return null;
    }

    return value;
}

/**
 * Sort children array by the provided sort specification
 */
export function sortChildren(children: BlockNode[], sortSpec: SortSpec): BlockNode[] {
    const sorted = [...children];

    sorted.sort((a, b) => {
        // Extract values using field path (e.g., "data.dueDate")
        const aValue = getFieldValue(a, sortSpec.by);
        const bValue = getFieldValue(b, sortSpec.by);

        // Handle null/undefined - always put them at the end
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return 1; // nulls to end
        if (bValue == null) return -1;

        // Type-aware comparison
        let comparison = 0;

        // Handle dates (check if it's a date string or Date object)
        const aDate = aValue instanceof Date ? aValue : tryParseDate(aValue);
        const bDate = bValue instanceof Date ? bValue : tryParseDate(bValue);

        if (aDate && bDate) {
            comparison = aDate.getTime() - bDate.getTime();
        } else if (typeof aValue === "string" && typeof bValue === "string") {
            // Use locale-aware string comparison
            comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === "number" && typeof bValue === "number") {
            comparison = aValue - bValue;
        } else {
            // Fallback to string comparison
            comparison = String(aValue).localeCompare(String(bValue));
        }

        // Apply direction
        return sortSpec.dir === "ASC" ? comparison : -comparison;
    });

    return sorted;
}

/**
 * Try to parse a value as a date
 */
function tryParseDate(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value !== "string") return null;

    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Filter children array by the provided filter specifications
 */
export function filterChildren(
    children: BlockNode[],
    filterSpecs: FilterSpec[],
    filterLogic: "AND" | "OR"
): BlockNode[] {
    if (filterSpecs.length === 0) return children;

    return children.filter((child) => {
        const results = filterSpecs.map((spec) => matchesFilter(child, spec));

        return filterLogic === "AND"
            ? results.every((r) => r) // All filters must match
            : results.some((r) => r); // Any filter can match
    });
}

/**
 * Check if a block node matches a filter specification
 */
function matchesFilter(node: BlockNode, filterSpec: FilterSpec): boolean {
    // Filter expression format: { "data.status": "ACTIVE" }
    // or { "data.priority": { "$gt": 3 } } for operators

    for (const [fieldPath, condition] of Object.entries(filterSpec.expr)) {
        const value = getFieldValue(node, fieldPath);

        if (!evaluateCondition(value, condition)) {
            return false;
        }
    }

    return true;
}

/**
 * Evaluate a filter condition against a value
 */
function evaluateCondition(value: unknown, condition: unknown): boolean {
    // Simple equality check
    if (typeof condition !== "object" || condition === null) {
        return value === condition;
    }

    // Operator-based conditions: { "$gt": 5, "$lt": 10 }
    const operators = condition as Record<string, unknown>;

    for (const [op, expected] of Object.entries(operators)) {
        switch (op) {
            case "$eq":
                return value === expected;
            case "$ne":
                return value !== expected;
            case "$gt":
                return (value as number) > (expected as number);
            case "$gte":
                return (value as number) >= (expected as number);
            case "$lt":
                return (value as number) < (expected as number);
            case "$lte":
                return (value as number) <= (expected as number);
            case "$in":
                return (expected as unknown[]).includes(value);
            case "$nin":
                return !(expected as unknown[]).includes(value);
            case "$contains":
                return String(value)
                    .toLowerCase()
                    .includes(String(expected).toLowerCase());
            default:
                return false;
        }
    }

    return true;
}

/**
 * Check if ordering mode is MANUAL
 */
export function isManualOrderingMode(config: BlockListConfiguration): boolean {
    return config.order.mode === "MANUAL";
}

/**
 * Check if ordering mode is SORTED
 */
export function isSortedOrderingMode(config: BlockListConfiguration): boolean {
    return config.order.mode === "SORTED";
}
