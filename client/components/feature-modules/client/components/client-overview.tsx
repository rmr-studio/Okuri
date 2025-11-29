"use client";

import { AddBlockDialog } from "@/components/feature-modules/blocks/components/entity/add-block-dialog";
import { EntityBlockEnvironment } from "@/components/feature-modules/blocks/components/entity/entity-block-environment";
import { useBlockEnvironment } from "@/components/feature-modules/blocks/context/block-environment-provider";
import { useGrid } from "@/components/feature-modules/blocks/context/grid-provider";
import { useTrackedEnvironment } from "@/components/feature-modules/blocks/context/tracked-environment-provider";
import { BlockType } from "@/components/feature-modules/blocks/interface/block.interface";
import { createBlockInstanceFromType } from "@/components/feature-modules/blocks/util/block/factory/instance.factory";
import { useClient } from "@/components/feature-modules/client/hooks/use-client";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EntityType } from "@/lib/types/types";
import { isResponseError } from "@/lib/util/error/error.util";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOrganisation } from "../../organisation/hooks/use-organisation";
import DeleteClient from "./delete-client";

/**
 * Toolbar component for client block environment.
 * Provides add block and save functionality for layout changes.
 */
interface ClientLayoutToolbarProps {
    clientId: string;
    organisationId: string;
}

const ClientLayoutToolbar = ({ clientId, organisationId }: ClientLayoutToolbarProps) => {
    const { save } = useGrid();
    const { addTrackedBlock } = useTrackedEnvironment();
    const { environment } = useBlockEnvironment();
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleBlockTypeSelect = (blockType: BlockType) => {
        // Create a new block instance from the selected type
        const newBlock = createBlockInstanceFromType(blockType, organisationId, {
            name: blockType.name,
        });

        // Add the block to the environment
        addTrackedBlock(newBlock);

        // Close the dialog
        setDialogOpen(false);
    };

    const hasBlocks = environment.trees.length > 0;

    return (
        <>
            <div className="mb-4 flex gap-2">
                {/* Add Block Button */}
                <Button onClick={() => setDialogOpen(true)} variant="outline" size="sm">
                    <PlusIcon className="size-4 mr-2" />
                    Add Block
                </Button>
            </div>

            {/* Add Block Dialog */}
            <AddBlockDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                organisationId={organisationId}
                entityType={EntityType.CLIENT}
                onBlockTypeSelect={handleBlockTypeSelect}
            />

            {/* Empty State - show when no blocks exist */}
            {!hasBlocks && (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-border rounded-lg bg-muted/10 mb-4">
                    <div className="text-center space-y-3 max-w-md">
                        <h3 className="text-lg font-semibold text-foreground">
                            No blocks added yet
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Start building your client overview by adding blocks. Choose from notes,
                            tasks, addresses, and more to customize this client's information.
                        </p>
                    </div>
                </div>
            )}
        </>
    );
};

/**
 * ClientOverview - Displays client information using block environment.
 *
 * This component replaces the traditional card-based layout with a flexible
 * block-based system that allows users to customize their view.
 */
export const ClientOverview = () => {
    const { data: organisation, isPending: isFetchingOrg, error: orgError } = useOrganisation();
    const {
        data: client,
        isPending: isFetchingClient,
        isLoadingAuth,
        error: clientError,
    } = useClient();
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showArchiveModal, setShowArchiveModal] = useState(false);

    const loading = isFetchingClient || isFetchingOrg || isLoadingAuth;

    /**
     * Effect to handle redirection if client is not found or error occurs
     */
    useEffect(() => {
        if (!loading && !client) {
            if (
                (!clientError || isResponseError(!clientError)) &&
                (!orgError || isResponseError(orgError))
            ) {
                // If no specific error, redirect to general clients page
                router.push("/dashboard/organisations");
                return;
            }

            if (orgError && isResponseError(orgError)) {
                router.push(`/dashboard/organisations?error=${orgError.error}`);
                return;
            }

            if (clientError && isResponseError(clientError)) {
                if (!organisation) {
                    router.push("/dashboard/organisations");
                    return;
                }

                router.push(
                    `/dashboard/organisation/${organisation.id}/clients?error=${clientError.error}`
                );
                return;
            }
        }
    }, [loading, clientError, orgError, client, router, organisation]);

    /**
     * Navigate to client edit form page with client-id param
     */
    const onEdit = () => {
        if (!client?.id || !organisation?.id) return;
        router.push(`/dashboard/organisation/${organisation.id}/clients/${client.id}/edit`);
    };

    const onArchive = () => {
        setShowArchiveModal(true);
    };

    /**
     * Navigate back to client list after deletion
     */
    const onDelete = () => {
        setShowDeleteModal(false);
        if (!organisation?.id) {
            router.push("/dashboard/organisations");
            return;
        }

        router.push(`/dashboard/${organisation.id}/clients`);
    };

    if (loading) {
        return (
            <div className="py-6 px-12 space-y-4">
                <Skeleton className="h-8 w-64" />
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 space-y-4">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (!client || !organisation) return null;

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisations", truncate: true },
        {
            label: organisation.name || "Organisation",
            href: `/dashboard/organisation/${organisation.id}/clients`,
        },
        {
            label: client.name || "Client",
            href: `/dashboard/organisation/${organisation.id}/clients/${client.id}`,
            active: true,
        },
    ];

    return (
        <>
            <div className="py-6 px-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <BreadCrumbGroup items={trail} />
                </div>

                <EntityBlockEnvironment
                    entityId={client.id}
                    entityType={EntityType.CLIENT}
                    organisationId={organisation.id}
                    renderToolbar={() => (
                        <ClientLayoutToolbar
                            clientId={client.id}
                            organisationId={organisation.id}
                        />
                    )}
                />

                {/* <aside className="space-y-6">
                        Quick Actions Card
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="flex justify-evenly space-x-3">
                                <Button
                                    onClick={onEdit}
                                    className="justify-center flex flex-grow border-edit cursor-pointer"
                                    variant="outline"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                <Button
                                    onClick={() => setShowArchiveModal(true)}
                                    className="justify-center flex flex-grow border-archive cursor-pointer"
                                    variant="outline"
                                >
                                    <ArchiveRestore className="w-4 h-4 mr-2" />
                                    Archive
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteModal(true)}
                                    className="justify-center flex flex-grow border-destructive cursor-pointer"
                                    variant="outline"
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                </Button>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        Contact Methods
                                    </span>
                                    <span className="text-sm font-medium">
                                        {[
                                            client.contact?.email && "Email",
                                            client.contact?.phone && "Phone",
                                            client.contact?.address && "Address",
                                        ].filter(Boolean).length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-muted-foreground">
                                        Custom Attributes
                                    </span>
                                </div>
                                {client.id && (
                                    <div className="pt-2 border-t">
                                        <span className="text-xs text-muted-foreground">
                                            Client ID
                                        </span>
                                        <p className="text-xs font-mono bg-muted px-2 py-1 rounded mt-1">
                                            {client.id}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </aside> */}
            </div>

            <DeleteClient
                client={showDeleteModal ? client : null}
                onArchive={onArchive}
                onDelete={onDelete}
                onClose={() => setShowDeleteModal(false)}
            />
        </>
    );
};
