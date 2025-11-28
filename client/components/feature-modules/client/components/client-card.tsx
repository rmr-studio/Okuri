"use client";

import type React from "react";
import { useState } from "react";

import type { Client } from "@/components/feature-modules/client/interface/client.interface";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Mail, MoreHorizontal, Phone } from "lucide-react";
import Link from "next/link";

interface ClientCardProps {
    client: Client;
    onEdit?: (client: Client) => void;
    onDelete?: (client: Client) => void;
}

export function ClientCard({ client, onEdit, onDelete }: ClientCardProps) {
    // Generate initials from client name
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((word) => word.charAt(0))
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // Generate a consistent color based on the client name
    const getAvatarColor = (name: string) => {
        const colors = [
            "bg-blue-500",
            "bg-green-500",
            "bg-purple-500",
            "bg-orange-500",
            "bg-pink-500",
            "bg-teal-500",
            "bg-indigo-500",
            "bg-red-500",
        ];
        const index = name.length % colors.length;
        return colors[index];
    };

    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleDropdownClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDropdownOpen(false);
        onEdit?.(client);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDropdownOpen(false);
        onDelete?.(client);
    };

    return (
        <Link href={`clients/${client.id}`}>
            <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar className={`h-10 w-10 ${getAvatarColor(client.name)} text-white`}>
                            <AvatarFallback className="bg-transparent text-white font-medium">
                                {getInitials(client.name)}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm text-foreground truncate">
                                {client.name}
                            </h3>
                            {client.contact?.email && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground truncate">
                                        {client.contact.email}
                                    </p>
                                </div>
                            )}
                            {client.contact?.phone && (
                                <div className="flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                        {client.contact.phone}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={handleDropdownClick}
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleEditClick}>
                                Edit client
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={handleDeleteClick}
                                className="text-destructive"
                            >
                                Delete client
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </Card>
        </Link>
    );
}
