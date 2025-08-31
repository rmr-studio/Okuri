"use client";

import { useAuth } from "@/components/provider/auth-context";
import { useOrganisation } from "@/hooks/useOrganisation";
import { TemplateClientTemplateFieldStructure } from "@/lib/interfaces/client.interface";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
    const { data: organisation, isLoading, isLoadingAuth, error } = useOrganisation();

    const router = useRouter();
    const queryClient = useQueryClient();

    // TODO: Ability to fetch available templates and select one to shape form schema

    const handleCancel = () => {
        if (organisation?.id) router.push(`/dashboard/organisation/${organisation.id}/clients`);
        else router.push(`/dashboard/clients`);
    };

    const onSubmit = async (data: ClientCreation) => {};

    return <ClientForm templates={[mockClientTemplate]} selectedTemplate={mockClientTemplate} onSubmit={onSubmit} />;
};

export default NewClient;
