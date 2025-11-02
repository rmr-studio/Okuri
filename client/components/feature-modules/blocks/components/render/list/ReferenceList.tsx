/**
 * ReferenceList - Renders a list of entity references.
 *
 * Unlike ContentBlockList, this is typically read-only and displays references to external entities.
 * Entity references are managed by the backend and don't support drag-and-drop reordering.
 */

"use client";

import { ReactNode } from "react";
import {
    BlockListConfiguration,
    EntityReferenceMetadata,
    ReferenceItem,
} from "../../../interface/block.interface";

interface ReferenceListProps {
    blockId: string;
    listConfig: BlockListConfiguration;
    references: ReferenceItem[];
    renderReference?: (reference: ReferenceItem, index: number) => ReactNode;
}

/**
 * Simple list component for displaying entity references.
 * No drag-and-drop since references are managed externally.
 */
export const ReferenceList: React.FC<ReferenceListProps> = ({
    blockId,
    listConfig,
    references,
    renderReference,
}) => {
    const isEmpty = references.length === 0;

    // Empty state
    if (isEmpty) {
        return (
            <div className="flex min-h-[120px] items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
                <p className="text-sm text-muted-foreground">
                    {listConfig.display.emptyMessage || "No references yet."}
                </p>
            </div>
        );
    }

    // Render reference items
    return (
        <div className="flex flex-col gap-3">
            {references.map((reference, index) => (
                <div
                    key={reference.entityId ?? index}
                    className="rounded-lg border border-border bg-background p-4 transition-shadow hover:shadow-md"
                >
                    {renderReference ? (
                        renderReference(reference, index)
                    ) : (
                        <div className="text-sm">
                            <p className="font-medium">
                                {reference.entity?.name ?? "Unknown Entity"}
                            </p>
                            <p className="text-muted-foreground">
                                Type: {reference.entity?.type ?? "unknown"}
                            </p>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
