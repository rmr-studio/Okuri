"use client";

import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";
import { RenderElementMetadata } from "../../util/block/block.registry";

/**
 * Schema for ReferenceBlock props.
 * Validates the entity data and metadata passed to the reference block.
 */
const schema = z
    .object({
        entityData: z.record(z.any()),
        entityType: z.string(),
        title: z.string().optional(),
    })
    .passthrough();

type Props = z.infer<typeof schema>;

/**
 * ReferenceBlock - Displays entity data in a block environment.
 *
 * This is a simple component for displaying entity attributes.
 * In future phases, this will be enhanced to use BlockRenderStructure
 * for more flexible and configurable rendering.
 *
 * The reference block shows all entity attributes in a grid layout.
 * It cannot be dragged (via block-no-drag class) to prevent accidental movement.
 *
 * @example
 * <ReferenceBlock
 *   entityData={client}
 *   entityType="CLIENT"
 *   title="Client Details"
 * />
 */
const Block: FC<Props> = ({ entityData, entityType, title }) => {
    // Format the entity type for display
    const formattedEntityType = entityType
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");

    // Get a display name from entity data (try common fields)
    const displayName = entityData.name || entityData.title || entityData.id || "Entity Reference";

    return (
        <Card className="block-no-drag">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{title || displayName}</CardTitle>
                    <Badge variant="secondary">{formattedEntityType}</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {Object.entries(entityData).map(([key, value]) => {
                        // Skip rendering null/undefined values
                        if (value === null || value === undefined) {
                            return null;
                        }

                        // Format the key for display
                        const formattedKey = key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())
                            .trim();

                        // Format the value
                        let displayValue: string;
                        if (typeof value === "object") {
                            displayValue = JSON.stringify(value, null, 2);
                        } else if (typeof value === "boolean") {
                            displayValue = value ? "Yes" : "No";
                        } else {
                            displayValue = String(value);
                        }

                        return (
                            <div key={key} className="space-y-1">
                                <dt className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                                    {formattedKey}
                                </dt>
                                <dd className="text-foreground break-words">{displayValue}</dd>
                            </div>
                        );
                    })}
                </dl>
            </CardContent>
        </Card>
    );
};

/**
 * ReferenceBlock component metadata for the block registry.
 *
 * This component displays entity data in a structured format.
 * It's used for the primary entity reference block on entity pages.
 */
export const ReferenceBlock: RenderElementMetadata<typeof schema> = {
    type: "REFERENCE",
    name: "Entity Reference",
    description: "Displays complete entity data in a structured format.",
    schema,
    component: Block as FC<z.infer<typeof schema>>,
};
