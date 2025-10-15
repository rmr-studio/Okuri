"use client";
import { useClient } from "@/components/feature-modules/client/hooks/useClient";
import { Badge } from "@/components/ui/badge";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOrganisation } from "@/hooks/useOrganisation";
import { isResponseError } from "@/lib/util/error/error.util";
import { ArchiveRestore, Edit, Mail, MapPin, Phone, Trash2, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DeleteClient from "./delete-client";

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
    }, [loading, clientError, orgError, client, router]);

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
        return <div>Loading...</div>;
    }

    if (!client) return;

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisations", truncate: true },
        {
            label: organisation?.name || "Organisation",
            href: `/dashboard/organisation/${organisation?.id}/clients`,
        },
        {
            label: client.name || "Client",
            href: `/dashboard/organisation/${organisation?.id}/clients/${client.id}`,
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
                <article className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information */}
                    <section className="lg:col-span-2 space-y-6">
                        {/* Basic Information Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex gap-2 items-center">
                                    <UserCircle className="w-8 h-8" />
                                    <div className="flex flex-col items-start">
                                        <div className="text-primary font-semibold">
                                            {client.name}
                                        </div>
                                        <div className="text-xs text-muted-foreground">Client</div>
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                Could do things like notes, tags, total invoices, total revenue,
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
                                                    {client.contactDetails.address.street && (
                                                        <p>
                                                            {client.contactDetails.address.street}
                                                        </p>
                                                    )}
                                                    <p>
                                                        {[
                                                            client.contactDetails.address.city,
                                                            client.contactDetails.address.state,
                                                            client.contactDetails.address
                                                                .postalCode,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(", ")}
                                                    </p>
                                                    {client.contactDetails.address.country && (
                                                        <p>
                                                            {client.contactDetails.address.country}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {client.contactDetails.additionalContacts &&
                                        Object.keys(client.contactDetails.additionalContacts)
                                            .length > 0 && (
                                            <div className="pt-4">
                                                <Separator className="mb-4" />
                                                <label className="text-sm font-medium text-muted-foreground">
                                                    Additional Contacts
                                                </label>
                                                <div className="mt-2 space-y-2">
                                                    {Object.entries(
                                                        client.contactDetails.additionalContacts
                                                    ).map(([key, value]) => (
                                                        <div
                                                            key={key}
                                                            className="flex justify-between items-center"
                                                        >
                                                            <span className="text-sm capitalize">
                                                                {key.replace(/([A-Z])/g, " $1")}
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
                                        {Object.entries(client.attributes).map(([key, value]) => (
                                            <div key={key} className="space-y-2">
                                                <label className="text-sm font-medium text-muted-foreground capitalize">
                                                    {key.replace(/([A-Z])/g, " $1")}
                                                </label>
                                                <div>
                                                    {Array.isArray(value) ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {value.map((item, index) => (
                                                                <Badge
                                                                    key={index}
                                                                    variant="secondary"
                                                                    className="text-xs"
                                                                >
                                                                    {item}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : typeof value === "boolean" ? (
                                                        <Badge
                                                            variant={
                                                                value ? "default" : "secondary"
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
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </section>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
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

                        {/* Client Summary */}
                        {/* TODO: Would need a way to view all invoices related to Client, sort by recent, overdue, active, etc */}
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
                </article>
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
