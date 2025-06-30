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
import { createClient } from "@/controller/client.controller";
import { ClientCreationRequest } from "@/lib/interfaces/client.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { ClientCreation, ClientForm, ClientFormSchema } from "./ClientForm";

const NewClient = () => {
    const { session, client: authClient } = useAuth();

    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleCancel = () => {
        router.push("/dashboard/clients");
    };

    const handleSubmission = async (values: ClientCreation) => {
        if (!session || !authClient) return;

        const client: ClientCreationRequest = {
            name: values.displayName,
            address: {
                street: values.street,
                city: values.city,
                state: values.state,
                country: values.country,
                postalCode: values.postalCode,
            },
            phone: values.phone,
            ndisNumber: values.ndisNumber,
        };

        clientMutation.mutate(client);
    };

    const clientMutation = useMutation({
        mutationFn: (client: ClientCreationRequest) => createClient(session, client),
        onMutate: () => {
            toastRef.current = toast.loading("Creating New Client...");
        },
        onSuccess: () => {
            toast.dismiss(toastRef.current);
            toast.success("Client created successfully");

            // Invalidate and refetch clients data
            queryClient.invalidateQueries({ queryKey: ["userClients", session?.user.id] });

            router.push("/dashboard/clients");
        },
        onError: (error) => {
            toast.dismiss(toastRef.current);
            toast.error(`Failed to create client: ${error.message}`);
        },
    });

    const form = useForm<ClientCreation>({
        resolver: zodResolver(ClientFormSchema),
        defaultValues: {
            displayName: "",
            phone: "",
            street: "",
            city: "",
            state: "",
            country: "AU",
            postalCode: "",
            ndisNumber: "",
        },
        mode: "onBlur",
    });

    return (
        <Card className="w-auto flex-grow lg:max-w-2xl h-fit m-2 md:m-6 lg:m-12">
            <CardHeader>
                <CardTitle>Create a new Client</CardTitle>
                <CardDescription>
                    <br />
                    This new client will be available for all future invoices and management
                    features
                    <br />
                    The clients Phone number and NDIS number must be unique from all other clients.
                </CardDescription>
            </CardHeader>
            <CardContent className="my-12">
                <ClientForm
                    form={form}
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
