"use client";

import { useAuth } from "@/components/provider/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

const NewClient = () => {
    const { session } = useAuth();
    

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
            <CardContent className="my-12"></CardContent>
        </Card>
    );
};

export default NewClient;
