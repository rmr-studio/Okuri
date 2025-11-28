"use client";

import type { Client } from "@/components/feature-modules/client/interface/client.interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useOrganisationClients } from "../../organisation/hooks/useOrganisationClients";
import { ClientCard } from "./client-card";
import DeleteClient from "./delete-client";

export default function ClientsList() {
    const { data: clients, isLoading, isLoadingAuth, error } = useOrganisationClients();
    const [searchQuery, setSearchQuery] = useState("");
    const [deletingClient, setDeletingClient] = useState<Client | null>(null);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const router = useRouter();

    useEffect(() => {
        if (!clients) return;
        const filtered = clients.filter(
            (client) =>
                client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                client.contact.email?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        setFilteredClients(filtered);
    }, [clients, searchQuery]);

    /**
     * Navigates to the client edit form
     */
    const editClient = (client: Client) => {
        // Disable if there is a current deletion occuring
        if (!!deletingClient) return;

        router.push(`clients/${client.id}/edit`);
    };

    const openDeleteDialog = (client: Client) => {
        setDeletingClient(client);
    };

    const closeDeleteDialog = () => {
        setDeletingClient(null);
    };

    return (
        <>
            <div className="container mx-auto p-6 max-w-7xl">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-2xl font-semibold text-foreground">Clients</h1>
                            <p className="text-muted-foreground mt-1">
                                Manage your organization's clients and their information.
                            </p>
                        </div>
                        <Link href={"clients/new"}>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Add Client
                            </Button>
                        </Link>
                    </div>

                    {/* Search Bar */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            disabled={isLoading || isLoadingAuth || !!error}
                            placeholder="Search clients..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Clients Grid */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-foreground">
                            All Clients ({filteredClients.length})
                        </h2>
                    </div>

                    {filteredClients.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">
                                {searchQuery
                                    ? "No clients found matching your search."
                                    : "No clients yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.map((client) => (
                                <ClientCard
                                    key={client.id}
                                    client={client}
                                    onEdit={editClient}
                                    onDelete={openDeleteDialog}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <DeleteClient client={deletingClient} onClose={closeDeleteDialog} />
        </>
    );
}
