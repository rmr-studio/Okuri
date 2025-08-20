"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { useOrganisation } from "@/hooks/useOrganisation";
import { TemplateClientTemplateFieldStructure } from "@/lib/interfaces/client.interface";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ClientForm } from "./form/ClientForm";

const NewClient = () => {
    const { session } = useAuth();
    const { data: organisation } = useOrganisation();

    const router = useRouter();
    const queryClient = useQueryClient();

    // TODO: Ability to fetch available templates and select one to shape form schema

    const handleCancel = () => {
        if (organisation?.id) router.push(`/dashboard/organisation/${organisation.id}/clients`);
        else router.push(`/dashboard/clients`);
    };

    return (
        <Card className="w-auto flex-grow lg:max-w-2xl h-fit m-2 md:m-6 lg:m-12">
            <CardHeader>
                <CardTitle>Create a new Client</CardTitle>
                <CardDescription>
                    <br />
                    This new client will be available for all future invoices and management
                    features
                </CardDescription>
            </CardHeader>
            <CardContent className="my-12">
                <ClientForm
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onTemplateChange={setSelectedTemplate}
                    handleSubmission={handleSubmission}
                    renderFooter={() => (
                        <CardFooter className="flex justify-between mt-4 py-1 border-t ">
                            <Button
                                type="button"
                                className="cursor-pointer"
                                onClick={handleCancel}
                                variant={"outline"}
                                size={"sm"}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" size={"sm"} className="cursor-pointer">
                                Create Client
                            </Button>
                        </CardFooter>
                    )}
                />
            </CardContent>
        </Card>
    );
};

export default NewClient;
