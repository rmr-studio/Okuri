"use client";

import type { Client } from "@/components/feature-modules/client/interface/client.interface";
import { useAuth } from "@/components/provider/auth-context";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { FC } from "react";

interface Props {
    onClose: () => void;
    onDelete?: (client: Client) => void;
    onArchive?: (client: Client) => void;
    client: Client | null;
}

const DeleteClient: FC<Props> = ({ onClose, client, onDelete }) => {
    const { session } = useAuth();

    const handleDelete = (client: Client) => {
        // Handle deletion mutation

        // Callback prop from original components
        onDelete?.(client);
    };
    const handleArchive = (client: Client) => {
        // Handle archival mutation

        // Callback prop from original components
        onDelete?.(client);
    };

    if (!client || !session) return null;
    return (
        <Dialog open={!!client} onOpenChange={onClose}>
            <DialogContent className="overflow-y-auto max-w-md">
                <DialogHeader className="space-y-3">
                    <DialogTitle className="text-xl">Delete or Archive Client?</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        What would you like to do with{" "}
                        <span className="font-semibold text-foreground">{client.name}</span>.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Archive Client
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-4">
                            The client and all of their invoices/reports will remain in the system,
                            but moved into an archived state. You'll still be able to view their
                            history, but they won't appear in your active client lists.
                        </p>
                        <p className="text-sm font-medium text-green-600 pl-4">
                            ✓ You can unarchive a client at any time
                        </p>
                    </div>

                    <div className="border-t pt-4 space-y-2">
                        <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            Permanently Delete
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed pl-4">
                            This will completely remove the client and all associated invoices,
                            reports, and data.
                        </p>
                        <div className="bg-destructive/60 dark:bg-destructive/10 rounded-md p-3 ml-4">
                            <p className="text-sm font-semibold text-content dark:text-destructive/70 flex items-center gap-2">
                                ⚠️ This action is irreversible
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="secondary">Archive Client</Button>
                    <Button variant="destructive">Permanently Delete</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DeleteClient;
