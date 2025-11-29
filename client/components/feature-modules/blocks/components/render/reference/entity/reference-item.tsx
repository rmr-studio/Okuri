"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, ChevronRight } from "lucide-react";
import { FC, useMemo } from "react";
import { Reference, ReferenceItem } from "../../../../interface/block.interface";
import { PanelWrapper } from "../../../panel/panel-wrapper";

interface EntityReferenceItemProps {
    id: string;
    item: ReferenceItem;
    reference: Reference | undefined;
    isLoading: boolean;
    error: Error | null;
    variant: "singleton" | "list";
    onRemove?: () => void;
}

const EXCLUDED_KEYS = new Set(["__typename", "createdAt", "updatedAt", "deletedAt"]);

/**
 * Wraps a single entity reference in a PanelWrapper.
 * Similar to ListItem, but for entity references.
 *
 * Supports two variants:
 * - singleton: Full card with all entity fields (for 1 entity)
 * - list: Compact card with name + subtitle (for 2+ entities)
 */
export const EntityReferenceItem: FC<EntityReferenceItemProps> = ({
    id,
    item,
    reference,
    isLoading,
    error,
    variant,
    onRemove,
}) => {
    // Quick actions for this entity
    const quickActions = useMemo(
        () =>
            onRemove
                ? [
                      {
                          id: "remove",
                          label: "Remove entity",
                          shortcut: "⌘⌫",
                          onSelect: onRemove,
                      },
                  ]
                : [],
        [onRemove]
    );

    // Loading state
    if (isLoading) {
        return (
            <PanelWrapper
                id={id}
                quickActions={quickActions}
                allowInsert={false}
                onDelete={onRemove}
            >
                <Card className="border-0 shadow-none">
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        {variant === "singleton" && (
                            <>
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-2/3" />
                            </>
                        )}
                    </CardContent>
                </Card>
            </PanelWrapper>
        );
    }

    // Error state
    if (error) {
        return (
            <PanelWrapper
                id={id}
                quickActions={quickActions}
                allowInsert={false}
                onDelete={onRemove}
            >
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Failed to load entity</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                </Alert>
            </PanelWrapper>
        );
    }

    // Entity not found or access denied
    if (!reference || !reference.entity || reference.warning) {
        return (
            <PanelWrapper
                id={id}
                quickActions={quickActions}
                allowInsert={false}
                onDelete={onRemove}
            >
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Entity unavailable</AlertTitle>
                    <AlertDescription>
                        {reference?.warning ||
                            "This entity could not be loaded. It may have been deleted or you may not have access."}
                    </AlertDescription>
                </Alert>
            </PanelWrapper>
        );
    }

    const entity = reference.entity as Record<string, unknown>;

    // Format entity type for display
    const formattedEntityType = reference.entityType
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ");

    // Get display name
    const displayName: string =
        item?.labelOverride ??
        (entity.name as string) ??
        (entity.title as string) ??
        (entity.id as string) ??
        "Entity";

    // Singleton variant - full card with all fields
    if (variant === "singleton") {
        return (
            <PanelWrapper
                id={id}
                quickActions={quickActions}
                allowInsert={false}
                onDelete={onRemove}
            >
                <Card className="border-0 shadow-none">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{displayName}</CardTitle>
                            <Badge variant="secondary">{item?.badge || formattedEntityType}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {Object.entries(entity).map(([key, value]) => {
                                if (
                                    value === null ||
                                    value === undefined ||
                                    EXCLUDED_KEYS.has(key)
                                ) {
                                    return null;
                                }

                                const formattedKey = key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (str) => str.toUpperCase())
                                    .trim();

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
            </PanelWrapper>
        );
    }

    // List variant - compact card with name + subtitle
    const subtitle =
        (entity.email as string) ??
        (entity.description as string) ??
        (entity.status as string) ??
        null;

    return (
        <PanelWrapper id={id} quickActions={quickActions} allowInsert={false} onDelete={onRemove}>
            <Card className="border-0 shadow-none hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{displayName}</h4>
                                <Badge variant="secondary" className="text-xs">
                                    {item?.badge || formattedEntityType}
                                </Badge>
                            </div>
                            {subtitle && (
                                <p className="text-xs text-muted-foreground truncate">
                                    {String(subtitle)}
                                </p>
                            )}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                    </div>
                </CardContent>
            </Card>
        </PanelWrapper>
    );
};
