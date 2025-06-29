"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Client } from "@/lib/interfaces/client.interface";
import { User } from "lucide-react";
import Link from "next/link";
import { FC } from "react";

interface Props {
    client: Client;
}

export const ClientTile: FC<Props> = ({ client }) => {
    const { name, phone, ndisNumber } = client;

    return (
        <Card className="p-3 cursor-pointer hover:bg-card/60 rounded-md">
            <Link href={`/dashboard/clients/${client.id}`}>
                <CardContent className="px-2 w-72">
                    <section className="flex items-center mb-2">
                        <User className="w-4 h-4" />
                        <div className="text-content ml-4">{name}</div>
                    </section>
                    <Separator />
                    <section className="mt-2">
                        <div className="flex justify-between">
                            <div className="text-xs text-muted-foreground">Phone:</div>
                            <div className="text-xs ml-4">{phone || "N/A"}</div>
                        </div>
                        <div className="flex justify-between">
                            <div className="text-xs text-muted-foreground">NDIS Number:</div>
                            <div className="text-xs ml-4">{ndisNumber || "N/A"}</div>
                        </div>
                    </section>
                </CardContent>
            </Link>
        </Card>
    );
};
