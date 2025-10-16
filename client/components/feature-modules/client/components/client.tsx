"use client";

import { ClientTemplateFieldStructure } from "@/components/feature-modules/client/interface/client.interface";
import { useAuth } from "@/components/provider/auth-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useClientOverview } from "@/hooks/useClientOverview";
import { AlertCircle, ArrowLeft, FileText, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import EditClient from "./edit-client";

const renderValue = (value: any): string => {
    if (Array.isArray(value)) return value.join(", ");
    if (typeof value === "object" && value !== null) {
        return JSON.stringify(value, null, 2);
    }
    return value?.toString() ?? "-";
};

const renderFieldsRecursive = (
    fields: Record<string, ClientTemplateFieldStructure> | ClientTemplateFieldStructure[],
    attributes: Record<string, any>
) => {
    // Handle case where it's a map
    if (!Array.isArray(fields)) {
        return Object.entries(fields).map(([key, field]) => {
            const value = attributes[key] ?? field.defaultValue;

            return (
                <div key={key} className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                        {field.name} {field.required && <span className="text-red-500">*</span>}
                    </p>
                    <p className="text-lg">{renderValue(value)}</p>

                    {/* Recurse if OBJECT */}
                    {field.type === "OBJECT" && field.children?.length > 0 && (
                        <div className="ml-4 border-l pl-4 space-y-2">
                            {renderFieldsRecursive(field.children, value ?? {})}
                        </div>
                    )}
                </div>
            );
        });
    }

    // Handle case where it's an array
    return fields.map((field) => {
        const key = field.name;
        const value = attributes[key] ?? field.defaultValue;

        return (
            <div key={key} className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                    {field.name} {field.required && <span className="text-red-500">*</span>}
                </p>
                <p className="text-lg">{renderValue(value)}</p>

                {/* Recurse again */}
                {field.type === "OBJECT" && field.children?.length > 0 && (
                    <div className="ml-4 border-l pl-4 space-y-2">
                        {renderFieldsRecursive(field.children, value ?? {})}
                    </div>
                )}
            </div>
        );
    });
};

export const ClientOverview = () => {
    const { data: client, isLoading, error, isLoadingAuth } = useClientOverview();
    const { session } = useAuth();
    const [editingClient, setEditingClient] = useState(false);
    const router = useRouter();

    if (isLoadingAuth || isLoading) return <ClientOverviewSkeleton />;

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

    const { name, attributes, template } = client;

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
                            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
                            <p className="text-muted-foreground">Client Overview</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setEditingClient(true)}>Edit Client</Button>
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

                {/* Info Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Basic Info */}
                    <Card>
                        <CardHeader className="flex flex-row items-center pb-2">
                            <CardTitle className="text-sm font-medium">Basic Information</CardTitle>
                            <User className="h-4 w-4 ml-auto text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-lg font-semibold">{name}</p>
                            <p className="text-sm text-muted-foreground mt-2">ID</p>
                            <p className="text-xs font-mono">{client.id}</p>
                        </CardContent>
                    </Card>

                    {/* Attributes */}
                    <Card className="md:col-span-2 lg:col-span-3">
                        <CardHeader className="flex flex-row items-center pb-2">
                            <CardTitle className="text-sm font-medium">Attributes</CardTitle>
                            <FileText className="h-4 w-4 ml-auto text-muted-foreground" />
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {template?.structure && Object.keys(template.structure).length > 0 ? (
                                renderFieldsRecursive(template.structure, attributes)
                            ) : Object.keys(attributes).length > 0 ? (
                                Object.entries(attributes).map(([key, value]) => (
                                    <div key={key} className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {key}
                                        </p>
                                        <p className="text-lg">{renderValue(value)}</p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground text-sm">
                                    No attributes available``
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {editingClient && (
                <EditClient client={client} onClose={() => setEditingClient(false)} />
            )}
        </>
    );
};

const ClientOverviewSkeleton = () => (
    <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-24" />
        </div>
        <Separator />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                    <CardHeader>
                        <Skeleton className="h-4 w-32" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-1/2" />
                    </CardContent>
                </Card>
            ))}
        </div>
    </div>
);
