"use client";

import { Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { FC } from "react";

interface EntityReferenceEmptyStateProps {
    onSelectClick?: () => void;
}

/**
 * Empty state for entity reference blocks with no selected entities.
 * Clickable to trigger entity selection.
 */
export const EntityReferenceEmptyState: FC<EntityReferenceEmptyStateProps> = ({
    onSelectClick,
}) => {
    return (
        <Card
            className="cursor-pointer hover:bg-accent/50 transition-colors border-2 border-dashed"
            onClick={onSelectClick}
        >
            <CardContent className="text-center py-12">
                <Database className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg mb-2">No entities selected</h3>
                <p className="text-sm text-muted-foreground mb-1">
                    Click here or use the "Select Entities" button in the toolbar
                </p>
                <p className="text-xs text-muted-foreground/70">
                    to add entities to this reference block
                </p>
            </CardContent>
        </Card>
    );
};
