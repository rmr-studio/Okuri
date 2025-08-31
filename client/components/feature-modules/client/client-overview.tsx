"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useClient } from "@/hooks/useClient";
import { ArrowLeft, Edit, Mail, MapPin, Phone, Trash2, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DeleteClient from "./delete-client";

export const ClientOverview = () => {
    const { data: client, isPending, isLoadingAuth, error } = useClient();
    const router = useRouter();
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    /**
     * Navigate back to Organisation Client list
     */
    const onBack = () => {
        router.back();
    };

    /**
     * Navigate to client edit form page with client-id param
     */
    const onEdit = () => {
        if (!client?.id) return;
        router.push(`/dashboard/clients/${client.id}/edit`);
    };

    /**
     * Navigate back to client list after deletion
     */
    const onDelete = () => {
        router.push("/dashboard/clients");
    };

    /**
     * Archive the client - sets an 'archived' flag on the client to true
     */
    const onArchive = () => {};

    const loading = isPending || isLoadingAuth;

    /**
     * Effect to handle redirection if client is not found or error occurs
     */
    useEffect(() => {
        if (!loading && !client) {
            // If there's an error, redirect with error message
            if (error) {
                router.push(`/dashboard/clients?error=${error}`);
                return;
            }

            router.push("/dashboard/clients");
        }
    }, [loading, error, client, router]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!client) return;

    return (
        <>
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                // TODO: MOVE TO BREADCRUMBS
                                {onBack && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onBack}
                                        className="flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Back
                                    </Button>
                                )}
                                <div>
                                    <h1 className="text-3xl font-bold text-foreground">
                                        {client.name}
                                    </h1>
                                    <p className="text-muted-foreground">Client Overview</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button onClick={onEdit} className="flex items-center gap-2">
                                    <Edit className="w-4 h-4" />
                                    Edit Client
                                </Button>
                                {onDelete && (
                                    <Button
                                        variant="destructive"
                                        onClick={onDelete}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Main Information */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Basic Information Card */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            Basic Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Client Name
                                                </label>
                                                <p className="text-lg font-semibold">
                                                    {client.name}
                                                </p>
                                            </div>
                                            {client.organisationId && (
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground">
                                                        Organization ID
                                                    </label>
                                                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                                        {client.organisationId}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Contact Information Card */}
                                {client.contactDetails && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Mail className="w-5 h-5" />
                                                Contact Information
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {client.contactDetails.email && (
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <label className="text-sm font-medium text-muted-foreground">
                                                                Email
                                                            </label>
                                                            <p className="text-sm">
                                                                {client.contactDetails.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                                {client.contactDetails.phone && (
                                                    <div className="flex items-center gap-3">
                                                        <Phone className="w-4 h-4 text-muted-foreground" />
                                                        <div>
                                                            <label className="text-sm font-medium text-muted-foreground">
                                                                Phone
                                                            </label>
                                                            <p className="text-sm">
                                                                {client.contactDetails.phone}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {client.contactDetails.address && (
                                                <div className="flex items-start gap-3 pt-2">
                                                    <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                                                    <div>
                                                        <label className="text-sm font-medium text-muted-foreground">
                                                            Address
                                                        </label>
                                                        <div className="text-sm space-y-1">
                                                            {client.contactDetails.address
                                                                .street && (
                                                                <p>
                                                                    {
                                                                        client.contactDetails
                                                                            .address.street
                                                                    }
                                                                </p>
                                                            )}
                                                            <p>
                                                                {[
                                                                    client.contactDetails.address
                                                                        .city,
                                                                    client.contactDetails.address
                                                                        .state,
                                                                    client.contactDetails.address
                                                                        .postalCode,
                                                                ]
                                                                    .filter(Boolean)
                                                                    .join(", ")}
                                                            </p>
                                                            {client.contactDetails.address
                                                                .country && (
                                                                <p>
                                                                    {
                                                                        client.contactDetails
                                                                            .address.country
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {client.contactDetails.additionalContacts &&
                                                Object.keys(
                                                    client.contactDetails.additionalContacts
                                                ).length > 0 && (
                                                    <div className="pt-4">
                                                        <Separator className="mb-4" />
                                                        <label className="text-sm font-medium text-muted-foreground">
                                                            Additional Contacts
                                                        </label>
                                                        <div className="mt-2 space-y-2">
                                                            {Object.entries(
                                                                client.contactDetails
                                                                    .additionalContacts
                                                            ).map(([key, value]) => (
                                                                <div
                                                                    key={key}
                                                                    className="flex justify-between items-center"
                                                                >
                                                                    <span className="text-sm capitalize">
                                                                        {key.replace(
                                                                            /([A-Z])/g,
                                                                            " $1"
                                                                        )}
                                                                    </span>
                                                                    <span className="text-sm font-medium">
                                                                        {value}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Custom Attributes Card */}
                                {client.attributes && Object.keys(client.attributes).length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Custom Attributes</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {Object.entries(client.attributes).map(
                                                    ([key, value]) => (
                                                        <div key={key} className="space-y-2">
                                                            <label className="text-sm font-medium text-muted-foreground capitalize">
                                                                {key.replace(/([A-Z])/g, " $1")}
                                                            </label>
                                                            <div>
                                                                {Array.isArray(value) ? (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {value.map(
                                                                            (item, index) => (
                                                                                <Badge
                                                                                    key={index}
                                                                                    variant="secondary"
                                                                                    className="text-xs"
                                                                                >
                                                                                    {item}
                                                                                </Badge>
                                                                            )
                                                                        )}
                                                                    </div>
                                                                ) : typeof value === "boolean" ? (
                                                                    <Badge
                                                                        variant={
                                                                            value
                                                                                ? "default"
                                                                                : "secondary"
                                                                        }
                                                                        className="text-xs"
                                                                    >
                                                                        {value ? "Yes" : "No"}
                                                                    </Badge>
                                                                ) : (
                                                                    <p className="text-sm">
                                                                        {value || "Not specified"}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-6">
                                {/* Quick Actions */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Quick Actions</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            onClick={onEdit}
                                            className="w-full justify-start bg-transparent"
                                            variant="outline"
                                        >
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Client Details
                                        </Button>
                                        {onDelete && (
                                            <Button
                                                onClick={onDelete}
                                                className="w-full justify-start bg-transparent"
                                                variant="outline"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete Client
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Client Summary */}
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
                                                    client.contactDetails?.email && "Email",
                                                    client.contactDetails?.phone && "Phone",
                                                    client.contactDetails?.address && "Address",
                                                ].filter(Boolean).length || 0}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                Custom Attributes
                                            </span>
                                            <span className="text-sm font-medium">
                                                {client.attributes
                                                    ? Object.keys(client.attributes).length
                                                    : 0}
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
                            </div>
                        </div>
                    </div>
                </div>
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
