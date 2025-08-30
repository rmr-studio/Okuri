"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Client } from "@/lib/interfaces/client.interface";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ClientCard } from "./ClientTile";
import DeleteClient from "./DeleteClient";
import EditClientSheetView from "./EditClient";

// Mock data for demonstration
const mockClients: Client[] = [
    {
        id: "1",
        organisationId: "org-1",
        name: "Henry Arthur",
        contactDetails: {
            email: "henry.arthur@example.com",
            phone: "+1 (555) 123-4567",
            additionalContacts: {},
        },
        attributes: {},
    },
    {
        id: "2",
        organisationId: "org-1",
        name: "Black Marvin",
        contactDetails: {
            email: "black.marvin@example.com",
            phone: "+1 (555) 234-5678",
            additionalContacts: {},
        },
        attributes: {},
    },
    {
        id: "3",
        organisationId: "org-1",
        name: "Olivia Martinez",
        contactDetails: {
            email: "olivia.martinez@example.com",
            additionalContacts: {},
        },
        attributes: {},
    },
    {
        id: "4",
        organisationId: "org-1",
        name: "Emily Carter",
        contactDetails: {
            email: "emily.carter@example.com",
            phone: "+1 (555) 345-6789",
            additionalContacts: {},
        },
        attributes: {},
    },
    {
        id: "5",
        organisationId: "org-1",
        name: "James Wright",
        contactDetails: {
            email: "james.wright@example.com",
            additionalContacts: {},
        },
        attributes: {},
    },
    {
        id: "6",
        organisationId: "org-1",
        name: "Sophia Bennett",
        contactDetails: {
            email: "sophia.bennett@example.com",
            phone: "+1 (555) 456-7890",
            additionalContacts: {},
        },
        attributes: {},
    },
    {
        id: "7",
        organisationId: "org-1",
        name: "Ava Mitchell",
        contactDetails: {
            email: "ava.mitchell@example.com",
            additionalContacts: {},
        },
        attributes: {},
    },
    {
        id: "8",
        organisationId: "org-1",
        name: "Liam Turner",
        contactDetails: {
            email: "liam.turner@example.com",
            phone: "+1 (555) 567-8901",
            additionalContacts: {},
        },
        attributes: {},
    },
];

export default function ClientsList() {
    const [clients, setClients] = useState<Client[]>(mockClients);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deletingClient, setDeletingClient] = useState<Client | null>(null);

    // Filter clients based on search query
    const filteredClients = clients.filter(
        (client) =>
            client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            client.contactDetails?.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const openEditClientSheet = (client: Client) => {
        setEditingClient(client);
    };

    const closeEditSheet = () => {
        setEditingClient(null);
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
                            {!searchQuery && (
                                <Button variant="outline" className="mt-4 gap-2 bg-transparent">
                                    <Plus className="h-4 w-4" />
                                    Add your first client
                                </Button>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredClients.map((client) => (
                                <ClientCard
                                    key={client.id}
                                    client={client}
                                    onEdit={openEditClientSheet}
                                    onDelete={openDeleteDialog}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <DeleteClient client={deletingClient} onClose={closeDeleteDialog} />
            <EditClientSheetView client={editingClient} onClose={closeEditSheet} />
        </>
    );
}
