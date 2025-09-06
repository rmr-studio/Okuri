import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { OrganisationMember } from "@/lib/interfaces/organisation.interface";
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import React, { useCallback, useMemo, useState } from "react";

// 👇 All custom cell components are imported from your new file
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganisationRole } from "@/hooks/useOrganisationRole";
import { DateCell, MemberActionsCell, MemberCell, RoleCell } from "./table";

interface Props {
    members: OrganisationMember[];
    onRemoveMember?: (memberId: string) => void;
    onUpdateRole?: (memberId: string, role: "OWNER" | "ADMIN" | "MEMBER") => void;
}

export const MemberTable: React.FC<Props> = ({ members, onRemoveMember, onUpdateRole }) => {
    const { role, hasRole } = useOrganisationRole();

    const [sorting, setSorting] = useState<any[]>([]);
    const [columnFilters, setColumnFilters] = useState<any[]>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    const handleRemoveMember = useCallback(
        (memberId: string) => {
            onRemoveMember?.(memberId) ?? console.log("Mock remove member:", memberId);
        },
        [onRemoveMember]
    );

    const handleUpdateRole = useCallback(
        (memberId: string, role: "OWNER" | "ADMIN" | "MEMBER") => {
            onUpdateRole?.(memberId, role) ?? console.log("Mock update role:", memberId, role);
        },
        [onUpdateRole]
    );

    const columns = useMemo<ColumnDef<OrganisationMember>[]>(
        () => [
            {
                id: "select",
                header: ({ table }) => (
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                ),
                cell: ({ row }) => (
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                ),
                enableSorting: false,
                enableHiding: false,
            },
            {
                accessorFn: (row) => row.user.name,
                id: "name",
                header: "Name",
                cell: ({ row }) => <MemberCell member={row.original} />,
            },
            {
                accessorFn: (row) => row.membershipDetails.role,
                id: "role",
                header: "Role",
                cell: ({ row }) => <RoleCell role={row.original.membershipDetails.role} />,
            },
            {
                accessorFn: (row) => row.membershipDetails.memberSince,
                id: "dateJoined",
                header: "Date Joined",
                cell: ({ row }) => (
                    <DateCell type="member" date={row.original.membershipDetails.memberSince} />
                ),
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <MemberActionsCell
                        canInvokeAction={hasRole("ADMIN")}
                        member={row.original}
                        onRemove={handleRemoveMember}
                        onUpdate={handleUpdateRole}
                    />
                ),
            },
        ],
        [handleRemoveMember, handleUpdateRole]
    );

    const table = useReactTable({
        data: members,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: { sorting, columnFilters, globalFilter },
    });

    const handleRoleFilterChange = useCallback(
        (value: string) => {
            table.getColumn("role")?.setFilterValue(value === "all" ? "" : value);
        },
        [table]
    );

    return (
        <>
            <CardHeader>
                <CardTitle>Team Members ({members.length})</CardTitle>
                <CardDescription>View and manage active members</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-4">
                    <Input
                        placeholder="Search members..."
                        value={globalFilter ?? ""}
                        onChange={(event) => setGlobalFilter(event.target.value)}
                        className="max-w-sm"
                    />
                    <Select
                        value={(table.getColumn("role")?.getFilterValue() as string) ?? "all"}
                        onValueChange={handleRoleFilterChange}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All roles</SelectItem>
                            <SelectItem value="OWNER">Owner</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((hg) => (
                                <TableRow key={hg.id}>
                                    {hg.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
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
                                    <TableCell
                                        colSpan={columns.length}
                                        className="h-24 text-center"
                                    >
                                        No members found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </>
    );
};
