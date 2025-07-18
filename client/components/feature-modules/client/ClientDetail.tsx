"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { updateClient } from "@/controller/client.controller";
import { useClientOverview } from "@/hooks/useClientOverview";
import { Client } from "@/lib/interfaces/client.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CreditCard, Edit, MapPin, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import EditClient from "./EditClient";
import { ClientCreation } from "./form/ClientForm";

export const ClientOverview = () => {
    const { data: client, isLoading, error, isLoadingAuth } = useClientOverview();
    const { session, client: authClient } = useAuth();
    const [editingClient, setEditingClient] = useState<boolean>(false);
    const toastRef = useRef<string | number | undefined>(undefined);
    const queryClient = useQueryClient();
    const router = useRouter();

    const openEditDrawer = () => {
        setEditingClient(true);
    };

    const handleDrawerClose = () => {
        setEditingClient(false);
    };

    const handleClientEdit = async (clientDetails: ClientCreation) => {
        // Handle mutation'
        if (!session || !authClient || !client) return;

        const updatedClient: Client = {
            ...client,
            name: clientDetails.displayName,
            phone: clientDetails.phone,
            address: {
                street: clientDetails.street,
                city: clientDetails.city,
                state: clientDetails.state,
                country: clientDetails.country,
                postalCode: clientDetails.postalCode,
            },
            ndisNumber: clientDetails.ndisNumber,
        };

        clientMutation.mutate(updatedClient);
        handleDrawerClose();
    };

    const clientMutation = useMutation({
        mutationFn: (client: Client) => updateClient(session, client),
        // Optimistic update
        onMutate: async (updatedClient) => {
            // Cancel any outgoing refetches to avoid overwriting the optimistic update
            await queryClient.cancelQueries({
                queryKey: ["client", client?.id],
            });

            // Snapshot the previous value
            const previousClient = queryClient.getQueryData<Client>(["client", client?.id]);

            // Optimistically update the cache
            queryClient.setQueryData(["client", client?.id], updatedClient);

            // Start the toast
            toastRef.current = toast.loading("Editing Client Details...");

            // Return context for rollback on error
            return { previousClient };
        },
        onSuccess: (data) => {
            toast.dismiss(toastRef.current);
            toast.success("Client updated successfully");

            // Ensure the cache is updated with the server response
            queryClient.setQueryData(["client", data.id], data);
        },
        onError: (error, _variables, context) => {
            // Roll back to the previous data on error
            queryClient.setQueryData(["client", client?.id], context?.previousClient);
            toast.dismiss(toastRef.current);
            toast.error(`Failed to update client: ${error.message}`);
        },
        // Always refetch after error or success to ensure data consistency (optional)
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["client", client?.id] });
        },
    });

    // Show loading state while authentication or data is loading
    if (isLoadingAuth || isLoading) {
        return <ClientOverviewSkeleton />;
    }

    // Show error state
    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load client information. Please try again later.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Show not found state
    if (!client) {
        return (
            <div className="container mx-auto p-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Client not found.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/dashboard/clients">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                            <p className="text-muted-foreground">Client Overview</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={openEditDrawer}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Client
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() =>
                                router.push(`/dashboard/invoice/new?clientId=${client.id}`)
                            }
                        >
                            New Invoice
                        </Button>
                    </div>
                </div>

                <Separator />

                {/* Client Information Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
                            <User className="h-4 w-4 ml-auto text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Full Name
                                </p>
                                <p className="text-lg font-semibold">{client.name}</p>
                            </div>
                            {/* Removed Client ID display */}
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card>
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Contact Information
                            </CardTitle>
                            <Phone className="h-4 w-4 ml-auto text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Phone Number
                                </p>
                                <p className="text-lg">{client.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                <Badge variant="secondary">Active</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NDIS Information */}
                    <Card>
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">NDIS Information</CardTitle>
                            <CreditCard className="h-4 w-4 ml-auto text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    NDIS Number
                                </p>
                                <p className="text-lg font-mono">{client.ndisNumber}</p>
                            </div>
                            <div>
                                <Badge
                                    variant="outline"
                                    className="text-green-600 border-green-600"
                                >
                                    Verified
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Address Information */}
                <Card>
                    <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Address Information</CardTitle>
                        <MapPin className="h-4 w-4 ml-auto text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {client.address && (
                                <div className="text-sm space-y-1">
                                    {client.address.street && <p>{client.address.street}</p>}
                                    {(client.address.city ||
                                        client.address.state ||
                                        client.address.postalCode) && (
                                        <p>
                                            {[
                                                client.address.city,
                                                client.address.state,
                                                client.address.postalCode,
                                            ]
                                                .filter(Boolean)
                                                .join(", ")}
                                        </p>
                                    )}
                                    {client.address.country && <p>{client.address.country}</p>}
                                </div>
                            )}
                            {!client.address && (
                                <p className="text-muted-foreground text-sm">
                                    No address information available
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
            {editingClient && (
                <EditClient
                    client={client}
                    onSubmit={handleClientEdit}
                    onClose={handleDrawerClose}
                />
            )}
        </>
    );
};

// Loading skeleton component
const ClientOverviewSkeleton = () => {
    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10" />
                    <div>
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-4 w-32 mt-2" />
                    </div>
                </div>
                <Skeleton className="h-10 w-24" />
            </div>

            <Separator />

            {/* Cards Skeleton */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-4 ml-auto" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-6 w-full" />
                            </div>
                            <div>
                                <Skeleton className="h-3 w-16 mb-2" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Address Card Skeleton */}
            <Card>
                <CardHeader className="flex flex-row items-center space-y-0 pb-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-4 ml-auto" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions Skeleton */}
            <Card>
                <CardHeader>
                    <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Skeleton key={i} className="h-8 w-24" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
