import { OrganisationInvite } from "@/components/feature-modules/organisation/interface/organisation.interface";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import React, { useMemo, useState } from "react";

import { revokeInvite } from "@/components/feature-modules/organisation/controller/organisation.controller";
import { useAuth } from "@/components/provider/auth-context";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DateCell, InviteActionsCell, RoleCell, StatusCell } from "./table";

interface Props {
    invites: OrganisationInvite[];
}

export const InviteTable: React.FC<Props> = ({ invites }) => {
    const [showAllInvites, setShowAllInvites] = useState(false);
    const pendingInvites = invites.filter((invite) => invite.status === "PENDING");
    const queryClient = useQueryClient();
    const { session } = useAuth();

    const onRevokeInvite = (invite: OrganisationInvite) => {
        const { organisationId } = invite;

        return useMutation({
            mutationFn: ({ id }: { id: string }) => revokeInvite(session, { organisationId, id }),
            onSuccess: () => {
                toast.success("Invitation revoked successfully!");
                // Invalidate and refetch invites
                queryClient.invalidateQueries({
                    queryKey: ["organisation", organisationId],
                });
            },
            onError: () => {
                toast.error("Failed to revoke invitation");
            },
        });
    };

    const columns = useMemo<ColumnDef<OrganisationInvite>[]>(
        () => [
            {
                accessorKey: "email",
                header: "Email",
                cell: ({ row }) => <span>{row.original.email}</span>,
            },
            {
                accessorKey: "role",
                header: "Role",
                cell: ({ row }) => <RoleCell role={row.original.role} />,
            },
            {
                accessorKey: "status",
                header: "Status",
                cell: ({ row }) => <StatusCell status={row.original.status} />,
            },
            {
                accessorKey: "createdAt",
                id: "dateInvited",
                header: "Date Invited",
                cell: ({ row }) => <DateCell type="invited" date={row.original.createdAt} />,
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <InviteActionsCell invite={row.original} onRevoke={onRevokeInvite} />
                ),
            },
        ],
        [onRevokeInvite]
    );

    const table = useReactTable({
        data: invites,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });

    return (
        <>
            <CardHeader>
                <div>
                    <CardTitle>Pending Invitations ({pendingInvites.length})</CardTitle>
                    <CardDescription>Manage invitations to your team</CardDescription>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllInvites(!showAllInvites)}
                >
                    {showAllInvites ? "Hide declined/expired" : "Show all invites"}
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((hg) => (
                            <TableRow key={hg.id}>
                                {hg.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No invites found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </>
    );
};
