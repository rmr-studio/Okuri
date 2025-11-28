"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Database } from "lucide-react";
import { FC } from "react";
import { z } from "zod";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useBlockHydration } from "../../hooks/use-block-hydration";
import { RenderElementMetadata } from "../../util/block/block.registry";

/**
 * Schema for ReferenceBlock props.
 *
 * This block uses progressive hydration - it receives reference items (entity IDs + types)
 * and lazily fetches the actual entity data when the block is rendered.
 */
const schema = z
    .object({
        blockId: z.string(), // Block's UUID for hydration
        items: z
            .array(
                z.object({
                    type: z.string(), // EntityType (CLIENT, ORGANISATION, etc.)
                    id: z.string(), // Entity UUID
                    labelOverride: z.string().nullable().optional(),
                    badge: z.string().nullable().optional(),
                })
            )
            .optional(),
        title: z.string().optional(),
    })
    .passthrough();

type Props = z.infer<typeof schema>;

/**
 * ReferenceBlock - Displays entity data using progressive hydration.
 *
 * This component:
 * 1. Receives reference items (entity type + ID) from block metadata
 * 2. Uses useBlockHydration hook to lazily fetch entity data
 * 3. Shows loading/error/empty states appropriately
 * 4. Renders resolved entity data in a clean layout
 *
 * Progressive hydration improves performance by only loading entity data
 * when the block is actually rendered, rather than fetching everything upfront.
 *
 * @example
 * <ReferenceBlock
 *   blockId="block-uuid"
 *   items={[{ type: "CLIENT", id: "client-uuid" }]}
 *   title="Client Reference"
 * />
 */
const Block: FC<Props> = ({ blockId, items = [], title }) => {
    const { organisationId } = useBlockEnvironment();

    // Hydrate block to get resolved entity data
    const { data: hydrationResult, isLoading, error } = useBlockHydration(blockId, organisationId);

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                </CardContent>
            </Card>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to load entity data</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
            </Alert>
        );
    }

    // Empty state - no entities selected
    if (!items || items.length === 0) {
        return (
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
                <CardContent className="text-center py-12">
                    <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg mb-2">No entities selected</h3>
                    <p className="text-sm text-muted-foreground">
                        Select entities using the toolbar button above
                    </p>
                </CardContent>
            </Card>
        );
    }

    const references = hydrationResult?.references || [];
    const EXCLUDED_KEYS = new Set(["__typename", "createdAt", "updatedAt", "deletedAt"]);

    // Render resolved entities
    return (
        <div className="space-y-4">
            {references.map((ref, index) => {
                const entity = ref.entity as Record<string, unknown> | null;
                const item = items.find((i) => i.id === ref.entityId);

                // Entity not found or access denied
                if (!entity || ref.warning) {
                    return (
                        <Alert key={ref.entityId} variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Entity unavailable</AlertTitle>
                            <AlertDescription>
                                {ref.warning ||
                                    "This entity could not be loaded. It may have been deleted or you may not have access."}
                            </AlertDescription>
                        </Alert>
                    );
                }

                // Format entity type for display
                const formattedEntityType = ref.entityType
                    .split("_")
                    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
                    .join(" ");

                // Get display name
                const displayName: string =
                    item?.labelOverride ?? entity.name ?? entity.title ?? entity.id ?? "Entity";

                return (
                    <Card key={ref.entityId}>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-lg">{displayName}</CardTitle>
                                <Badge variant="secondary">
                                    {item?.badge || formattedEntityType}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                {Object.entries(entity).map(([key, value]) => {
                                    // Skip null/undefined and complex nested objects
                                    if (
                                        value === null ||
                                        value === undefined ||
                                        EXCLUDED_KEYS.has(key)
                                    ) {
                                        return null;
                                    }

                                    // Format the key
                                    const formattedKey = key
                                        .replace(/([A-Z])/g, " $1")
                                        .replace(/^./, (str) => str.toUpperCase())
                                        .trim();

                                    // Format the value
                                    let displayValue: string;
                                    if (typeof value === "object") {
                                        displayValue = Array.isArray(value)
                                            ? `[${value.length} items]`
                                            : "[Complex data]";
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
                                            <dd className="text-foreground break-words">
                                                {displayValue}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
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
