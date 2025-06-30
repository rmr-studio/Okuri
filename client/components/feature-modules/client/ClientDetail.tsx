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
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ClientCreation } from "./ClientForm";
import EditClient from "./EditClient";

export const ClientOverview = () => {
    const { data: client, isLoading, error, isLoadingAuth } = useClientOverview();
    const { session, client: authClient } = useAuth();
    const [editingClient, setEditingClient] = useState<boolean>(false);
    const toastRef = useRef<string | number | undefined>(undefined);
    const queryClient = useQueryClient();

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
    };

    const clientMutation = useMutation({
        mutationFn: (client: Client) => updateClient(session, client),
        onMutate: () => {
            toastRef.current = toast.loading("Creating New Client...");
        },
        onSuccess: () => {
            toast.dismiss(toastRef.current);
            toast.success("Client created successfully");

            // Alter Client details stored in cache
            queryClient.setQueryData(["clientOverview"], (oldData: Client | undefined) => {
                if (!oldData) return oldData;
                return { ...oldData, ...client };
            });
        },
        onError: (error) => {
            toast.dismiss(toastRef.current);
            toast.error(`Failed to create client: ${error.message}`);
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
                    <Button onClick={openEditDrawer}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Client
                    </Button>
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
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Client ID
                                </p>
                                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                    {client.id}
                                </p>
                            </div>
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

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/clients/${client.id}/appointments`}>
                                    View Appointments
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/clients/${client.id}/documents`}>
                                    Documents
                                </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/clients/${client.id}/notes`}>Notes</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/dashboard/clients/${client.id}/billing`}>
                                    Billing
                                </Link>
                            </Button>
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
