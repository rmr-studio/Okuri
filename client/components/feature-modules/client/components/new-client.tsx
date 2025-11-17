"use client";

import {
    Client,
    ClientCreationRequest,
    TemplateClientTemplateFieldStructure,
} from "@/components/feature-modules/client/interface/client.interface";
import { createClient } from "@/components/feature-modules/client/service/client.service";
import { useAuth } from "@/components/provider/auth-context";
import { BreadCrumbGroup, BreadCrumbTrail } from "@/components/ui/breadcrumb-group";
import { useOrganisation } from "@/hooks/useOrganisation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { ClientCreation, ClientForm } from "./form/client-form";
// Mock template data for demonstration
export const mockClientTemplate: TemplateClientTemplateFieldStructure = {
    id: "1",
    userId: undefined, // Add this line if userId is optional
    name: "Standard Business Client",
    description: undefined, // Add this line if description is optional
    type: "CLIENT", // Add this line to specify the type
    structure: {
        industry: {
            name: "Industry",
            type: "SELECT",
            required: true,
            description: "Select the client's industry",
            options: [
                "Healthcare",
                "Technology",
                "Finance",
                "Retail",
                "Manufacturing",
                "Education",
            ],
            children: [],
        },
        companySize: {
            name: "Company Size",
            type: "SELECT",
            required: false,
            description: "Number of employees",
            options: ["1-10", "11-50", "51-100", "101-500", "500+"],
            children: [],
        },
        budget: {
            name: "Annual Budget",
            type: "NUMBER",
            required: false,
            description: "Annual budget in USD",
            children: [],
        },
        isActive: {
            name: "Active Client",
            type: "BOOLEAN",
            required: false,
            description: "Is this an active client?",
            children: [],
        },
        services: {
            name: "Services Required",
            type: "MULTISELECT",
            required: false,
            description: "Select all applicable services",
            options: ["Consulting", "Development", "Design", "Marketing", "Support"],
            children: [],
        },
    },
    isDefault: false, // or true based on your needs
    isPremade: true, // or false based on your needs
    createdAt: new Date().toISOString(), // or provide a specific date
    updatedAt: new Date().toISOString(), // or provide a specific date
};

const NewClient = () => {
    const { session } = useAuth();
    const { data: organisation, isPending, isLoadingAuth, error } = useOrganisation();
    const toastRef = useRef<string | number | undefined>(undefined);
    const router = useRouter();
    const queryClient = useQueryClient();

    // TODO: Ability to fetch available templates and select one to shape form schema
    const loading = isPending || isLoadingAuth;

    useEffect(() => {
        if (!loading && !organisation) {
            // If there's an error, redirect with error message
            if (error) {
                router.push(`/dashboard/organisation?error=${error}`);
                return;
            }

            router.push("/dashboard/organisation");
        }
    }, [loading, error, organisation, router]);

    // TODO: Handle Cancelation and breadcumbs
    const handleCancel = () => {
        if (organisation?.id) router.push(`/dashboard/organisation/${organisation.id}/clients`);
        else router.push(`/dashboard/organisation`);
    };

    const onSubmit = async (data: ClientCreation) => {
        if (!organisation?.id) return;

        // TODO: Add link to template if one was selected or if one was extended/created and saved

        const client: ClientCreationRequest = {
            name: data.name,
            organisationId: organisation.id,
            contact: {
                email: data.contactDetails?.email,
                phone: data.contactDetails?.phone,
                address: data.contactDetails?.address,
            },

            attributes: data.attributes || {},
        };

        clientCreationMutation.mutate(client);
    };
    const clientCreationMutation = useMutation({
        mutationFn: (client: ClientCreationRequest) => createClient(session, client),
        onMutate: () => {
            toastRef.current = toast.loading("Creating New Client...");
        },
        onSuccess: (client: Client) => {
            toast.dismiss(toastRef.current);
            toast.success("Client created successfully");

            if (!organisation) {
                router.push("/dashboard/organisation");
                return;
            }

            // Invalidate Organisation client list
            queryClient.invalidateQueries({
                queryKey: ["organisation", organisation.id, "clients"],
            });

            router.push(`/dashboard/organisation/${organisation.id}/clients/${client.id}`);
        },
        onError: (error) => {
            toast.dismiss(toastRef.current);
            toast.error(`Failed to create organisation: ${error.message}`);
        },
    });

    const trail: BreadCrumbTrail[] = [
        { label: "Home", href: "/dashboard" },
        { label: "Organisations", href: "/dashboard/organisations", truncate: true },
        {
            label: organisation?.name || "Organisation",
            href: `/dashboard/organisation/${organisation?.id}/clients`,
        },
        {
            label: "Clients",
            href: `/dashboard/organisation/${organisation?.id}/clients/`,
        },
        { label: "New", href: "#", active: true },
    ];

    return (
        <ClientForm
            className="m-8"
            renderHeader={() => (
                <>
                    <BreadCrumbGroup items={trail} className="mb-4" />
                    <h1 className="text-xl font-bold text-primary mb-2">Create New Client</h1>
                    <p className="text-muted-foreground text-sm">
                        Set up your client profile in just a few steps. This will help your team
                        identify and manage client relationships effectively.
                    </p>
                </>
            )}
            selectedTemplate={mockClientTemplate}
            onSubmit={onSubmit}
        />
    );
};

export default NewClient;
