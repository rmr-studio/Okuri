"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClient } from "@/hooks/useClient";
import { Client } from "@/lib/interfaces/client.interface";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ClientTile } from "./ClientTile";

const ClientsOverview = () => {
    const { data: clients, isPending: isLoadingCLients } = useClient();
    const [clientSearch, setClientSearch] = useState<string>("");
    const [renderedClients, setRenderedClients] = useState<Client[]>([]);
    useEffect(() => {
        if (clients) {
            setRenderedClients(
                clients.filter((client) =>
                    client?.name.toLowerCase().includes(clientSearch?.toLowerCase() || "")
                )
            );
        } else {
            setRenderedClients([]);
        }
    }, [clients, clientSearch]);

    return (
        <div className="m-6 md:m-12 lg:m-16">
            <h1 className="text-2xl text-content">Your Clients</h1>
            <section className="flex mt-6 space-x-4">
                <Link href={"/dashboard/clients/new"}>
                    <Button variant={"outline"} size={"sm"} className="h-full cursor-pointer">
                        <PlusCircle className="mr-2" />
                        Add Client
                    </Button>
                </Link>
                <Input
                    className="w-full max-w-sm"
                    placeholder="Search Clients"
                    value={clientSearch ?? ""}
                    onChange={(e) => {
                        setClientSearch(e.target.value);
                        if (clients) {
                            setRenderedClients(
                                clients.filter((client) =>
                                    client.name.toLowerCase().includes(e.target.value.toLowerCase())
                                )
                            );
                        }
                    }}
                />
            </section>
            <section className="flex flex-wrap flex-shrink-0 mt-8 space-x-4">
                {renderedClients.length > 0 ? (
                    <>
                        {renderedClients.map((client) => (
                            <ClientTile key={client.id} client={client} />
                        ))}
                    </>
                ) : isLoadingCLients ? (
                    <>Loading... </>
                ) : (
                    <>No Clients found</>
                )}
            </section>
        </div>
    );
};

export default ClientsOverview;
