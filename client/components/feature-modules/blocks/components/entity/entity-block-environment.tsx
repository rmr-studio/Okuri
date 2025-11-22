"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { FC, useMemo } from "react";
import { BlockEditProvider } from "../../context/block-edit-provider";
import { BlockEnvironmentProvider } from "../../context/block-environment-provider";
import { BlockFocusProvider } from "../../context/block-focus-provider";
import { RenderElementProvider } from "../../context/block-renderer-provider";
import { GridContainerProvider } from "../../context/grid-container-provider";
import { GridProvider } from "../../context/grid-provider";
import { LayoutChangeProvider } from "../../context/layout-change-provider";
import { LayoutHistoryProvider } from "../../context/layout-history-provider";
import { TrackedEnvironmentProvider } from "../../context/tracked-environment-provider";
import { useEntityLayout } from "../../hooks/use-entity-layout";
import { BlockEnvironmentGridSync } from "../../hooks/use-environment-grid-sync";
import { EntityType } from "../../interface/layout.interface";
import { DEFAULT_WIDGET_OPTIONS } from "../demo/block-demo";
import { BlockEditDrawer, EditModeIndicator } from "../forms";
import { KeyboardNavigationHandler } from "../navigation/keyboard-navigation-handler";
import { WidgetEnvironmentSync } from "../sync/widget.sync";

/**
 * Props for EntityBlockEnvironment component.
 *
 * This is the generic wrapper that manages block environments for any entity type.
 */
export interface EntityBlockEnvironmentProps {
    /** UUID of the entity (client, organisation, etc.) */
    entityId: string;
    /** Type of entity (CLIENT, ORGANISATION, PROJECT, INVOICE) */
    entityType: EntityType;
    /** Organisation ID for the entity */
    organisationId: string;
    /** Optional toolbar component to render above the grid */
    renderToolbar?: () => React.ReactNode;
    /** Optional wrapper function to customize the outer container */
    renderWrapper?: (children: React.ReactNode) => React.ReactNode;
    /** Optional element wrapper for editor panels (slash menu, toolbar, etc.) */
    wrapElement?: any; // Type from editorPanel wrapper
}

/**
 * EntityBlockEnvironment - Generic block environment wrapper for entities.
 *
 * This component:
 * - Loads the block environment for an entity (with lazy initialization)
 * - Manages all required providers in the correct hierarchy
 * - Handles loading and error states
 * - Renders the grid with all blocks
 * - Supports custom toolbars and wrappers
 *
 * @example
 * <EntityBlockEnvironment
 *   entityId={clientId}
 *   entityType={EntityType.CLIENT}
 *   organisationId={organisationId}
 *   renderToolbar={() => <ClientToolbar />}
 * />
 */
export const EntityBlockEnvironment: FC<EntityBlockEnvironmentProps> = ({
    entityId,
    entityType,
    organisationId,
    renderToolbar,
    renderWrapper,
    wrapElement,
}) => {
    const { environment, isLoading, error } = useEntityLayout(organisationId, entityId, entityType);

    const gridOptions = useMemo(() => {
        return environment?.layout?.layout ?? DEFAULT_WIDGET_OPTIONS;
    }, [environment]);

    // Loading state
    if (isLoading) {
        return (
            <div className="space-y-4 w-full h-full">
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to load block environment</AlertTitle>
                <AlertDescription>
                    {error.message ||
                        "An unexpected error occurred while loading the block environment."}
                </AlertDescription>
            </Alert>
        );
    }

    // No environment found (shouldn't happen with lazy initialization)
    if (!environment) {
        return (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No block environment found</AlertTitle>
                <AlertDescription>
                    Unable to load or create block environment for this entity.
                </AlertDescription>
            </Alert>
        );
    }

    // Render the complete block environment with provider hierarchy
    const content = (
        <BlockEnvironmentProvider
            organisationId={organisationId}
            initialTrees={environment.trees}
            blockTreeLayout={environment.layout}
        >
            <GridProvider initialOptions={gridOptions}>
                <LayoutHistoryProvider>
                    <LayoutChangeProvider>
                        <TrackedEnvironmentProvider>
                            <BlockFocusProvider>
                                <BlockEditProvider>
                                    <EditModeIndicator />
                                    <KeyboardNavigationHandler />
                                    {/* {renderToolbar?.()} */}
                                    <BlockEnvironmentGridSync />
                                    <WidgetEnvironmentSync />
                                    <GridContainerProvider>
                                        <RenderElementProvider wrapElement={wrapElement} />
                                    </GridContainerProvider>
                                    <BlockEditDrawer />
                                </BlockEditProvider>
                            </BlockFocusProvider>
                        </TrackedEnvironmentProvider>
                    </LayoutChangeProvider>
                </LayoutHistoryProvider>
            </GridProvider>
        </BlockEnvironmentProvider>
    );

    // Apply custom wrapper if provided
    return renderWrapper ? renderWrapper(content) : content;
};
