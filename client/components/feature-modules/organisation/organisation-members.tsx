"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
} from "@tanstack/react-table";
import { format } from "date-fns";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    Download,
    MoreHorizontal,
    Plus,
    Settings,
    Shield,
    Trash2,
    Upload,
    User,
    Users,
} from "lucide-react";
import React, { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

// Form validation schema
const inviteSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

// Types
type Role = "OWNER" | "ADMIN" | "MEMBER";
type Status = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "Active";

interface MemberData {
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    date: string;
    type: "member" | "invited";
    avatar?: string;
    isCurrentUser?: boolean;
}

// Role display mapping - moved outside component to prevent recreation
const roleDisplayMap = {
    OWNER: { label: "Owner", color: "bg-red-100 text-red-800", icon: Shield },
    ADMIN: { label: "Admin", color: "bg-blue-100 text-blue-800", icon: Shield },
    MEMBER: { label: "Member", color: "bg-green-100 text-green-800", icon: User },
} as const;

// Status display mapping - moved outside component to prevent recreation
const statusDisplayMap = {
    PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    ACCEPTED: { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle },
    DECLINED: { label: "Declined", color: "bg-red-100 text-red-800", icon: AlertCircle },
    EXPIRED: { label: "Expired", color: "bg-gray-100 text-gray-800", icon: AlertCircle },
    Active: { label: "Active", color: "bg-green-100 text-green-800", icon: CheckCircle },
} as const;

// Mock data moved outside component to prevent recreation
const MOCK_ORGANISATION = {
    members: [
        {
            user: {
                id: "1",
                name: "Amie Ross",
                email: "amie@acme.com",
                avatarUrl:
                    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
            },
            membershipDetails: {
                role: "OWNER" as const,
                memberSince: "2024-11-02T00:00:00Z",
            },
        },
        {
            user: {
                id: "2",
                name: "Oliver House",
                email: "oliver@acme.com",
                avatarUrl:
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            },
            membershipDetails: {
                role: "MEMBER" as const,
                memberSince: "2025-01-24T00:00:00Z",
            },
        },
        {
            user: {
                id: "3",
                name: "Diana Mounter",
                email: "diana@acme.com",
                avatarUrl:
                    "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
            },
            membershipDetails: {
                role: "MEMBER" as const,
                memberSince: "2025-01-22T00:00:00Z",
            },
        },
        {
            user: {
                id: "4",
                name: "Nichole Wischoff",
                email: "nichole@acme.com",
                avatarUrl:
                    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
            },
            membershipDetails: {
                role: "MEMBER" as const,
                memberSince: "2024-01-16T00:00:00Z",
            },
        },
    ],
};

const MOCK_INVITES = [
    {
        id: "invite-1",
        organisationId: "org-1",
        email: "sam@samforde.com",
        inviteToken: "token-1",
        role: "MEMBER" as const,
        status: "PENDING" as const,
        createdAt: "2025-01-26T00:00:00Z",
        expiresAt: "2025-02-26T00:00:00Z",
    },
    {
        id: "invite-2",
        organisationId: "org-1",
        email: "adam@amie.com",
        inviteToken: "token-2",
        role: "MEMBER" as const,
        status: "PENDING" as const,
        createdAt: "2025-01-26T00:00:00Z",
        expiresAt: "2025-02-26T00:00:00Z",
    },
    {
        id: "invite-3",
        organisationId: "org-1",
        email: "josh@openai.com",
        inviteToken: "token-3",
        role: "MEMBER" as const,
        status: "ACCEPTED" as const,
        createdAt: "2025-01-06T00:00:00Z",
        expiresAt: "2025-02-06T00:00:00Z",
    },
];

// Helper components
const RoleCell = React.memo(({ role }: { role: string }) => {
    const roleConfig = roleDisplayMap[role as keyof typeof roleDisplayMap];

    if (!roleConfig) {
        return (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                <User className="w-3 h-3 mr-1" />
                Unknown ({role})
            </Badge>
        );
    }

    const RoleIcon = roleConfig.icon;
    return (
        <Badge variant="secondary" className={roleConfig.color}>
            <RoleIcon className="w-3 h-3 mr-1" />
            {roleConfig.label}
        </Badge>
    );
});

const StatusCell = React.memo(({ status }: { status: string }) => {
    const statusConfig = statusDisplayMap[status as keyof typeof statusDisplayMap];

    if (!statusConfig) {
        return (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                <AlertCircle className="w-3 h-3 mr-1" />
                Unknown ({status})
            </Badge>
        );
    }

    const StatusIcon = statusConfig.icon;
    return (
        <Badge variant="secondary" className={statusConfig.color}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {statusConfig.label}
        </Badge>
    );
});

const MemberCell = React.memo(({ member }: { member: MemberData }) => (
    <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
            <AvatarImage src={member.avatar} />
            <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
            <div className="font-medium">{member.name}</div>
            <div className="text-sm text-muted-foreground">{member.email}</div>
        </div>
    </div>
));

const DateCell = React.memo(({ date, type }: { date: string; type: "member" | "invited" }) => {
    const dateObj = new Date(date);
    const isInvited = type === "invited";

    return (
        <div className="text-sm text-muted-foreground">
            {isInvited ? "Invited" : "Joined"} {format(dateObj, "MMM dd, yyyy")}
        </div>
    );
});

const ActionsCell = React.memo(
    ({ member, onRevokeInvite }: { member: MemberData; onRevokeInvite: (id: string) => void }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {member.type === "invited" ? (
                    <>
                        <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Copy invite link
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={() => onRevokeInvite(member.id)}
                            className="text-red-600"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Revoke invite
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem>
                            <Settings className="w-4 h-4 mr-2" />
                            Change role
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove member
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
);

const OrganisationMemberList = () => {
    // State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");

    // Mock loading states
    const isLoadingOrg = false;
    const isLoadingInvites = false;

    // Form setup
    const form = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            role: "MEMBER",
        },
    });

    // Mock mutations with useCallback to prevent recreation
    const mockInviteMutation = useMemo(
        () => ({
            mutate: (data: InviteFormData) => {
                console.log("Mock invite mutation:", data);
                setTimeout(() => {
                    console.log("Mock invite success!");
                    form.reset();
                }, 1000);
            },
            isPending: false,
        }),
        [form]
    );

    const handleRevokeInvite = useCallback((inviteId: string) => {
        console.log("Mock revoke mutation:", inviteId);
        setTimeout(() => {
            console.log("Mock revoke success!");
        }, 1000);
    }, []);

    // Handle role change with useCallback to prevent recreation
    const handleRoleChange = useCallback(
        (value: string) => {
            form.setValue("role", value as Role);
        },
        [form]
    );

    // Handle invite submission
    const onSubmit = useCallback(
        (data: InviteFormData) => {
            mockInviteMutation.mutate(data);
        },
        [mockInviteMutation]
    );

    // Combine members and invites for display - fixed dependencies
    const allMembers = useMemo((): MemberData[] => {
        const members: MemberData[] = [];

        // Add current members
        MOCK_ORGANISATION.members.forEach((member) => {
            members.push({
                id: member.user.id,
                name: member.user.name,
                email: member.user.email,
                role: member.membershipDetails.role,
                status: "Active",
                date: member.membershipDetails.memberSince,
                type: "member",
                avatar: member.user.avatarUrl,
                isCurrentUser: false,
            });
        });

        // Add pending invites
        MOCK_INVITES.forEach((invite) => {
            members.push({
                id: invite.id,
                name: invite.email,
                email: invite.email,
                role: invite.role,
                status: invite.status,
                date: invite.createdAt,
                type: "invited",
                isCurrentUser: false,
            });
        });

        return members;
    }, []); // Empty dependency array since we're using constants

    // Table columns definition - memoized to prevent recreation
    const columns = useMemo(
        (): ColumnDef<MemberData>[] => [
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
                accessorKey: "name",
                header: "Name",
                cell: ({ row }) => <MemberCell member={row.original} />,
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
                accessorKey: "date",
                header: "Date",
                cell: ({ row }) => <DateCell date={row.original.date} type={row.original.type} />,
            },
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <ActionsCell member={row.original} onRevokeInvite={handleRevokeInvite} />
                ),
            },
        ],
        [handleRevokeInvite]
    );

    const table = useReactTable({
        data: allMembers,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        state: {
            sorting,
            columnFilters,
            globalFilter,
        },
    });

    // Handle filter changes with useCallback
    const handleRoleFilterChange = useCallback(
        (value: string) => {
            table.getColumn("role")?.setFilterValue(value === "all" ? "" : value);
        },
        [table]
    );

    const handleStatusFilterChange = useCallback(
        (value: string) => {
            table.getColumn("status")?.setFilterValue(value === "all" ? "" : value);
        },
        [table]
    );

    if (isLoadingOrg || isLoadingInvites) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading team members...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Team Settings - Invite Members</h1>
                    <p className="text-muted-foreground">
                        Manage and view your coworkers and guests
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload CSV
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Invite Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Invite Members
                    </CardTitle>
                    <CardDescription>Send invitations to new team members</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    {...form.register("email")}
                                    placeholder="Add emails..."
                                    className={form.formState.errors.email ? "border-red-500" : ""}
                                />
                                {form.formState.errors.email && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {form.formState.errors.email.message}
                                    </p>
                                )}
                            </div>
                            <Select value={form.watch("role")} onValueChange={handleRoleChange}>
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MEMBER">Member</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                type="submit"
                                disabled={mockInviteMutation.isPending}
                                className="min-w-[100px]"
                            >
                                {mockInviteMutation.isPending ? "Inviting..." : "Invite (1)"}
                            </Button>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <Button variant="link" className="p-0 h-auto">
                                <Settings className="w-4 h-4 mr-1" />
                                Personalize your invitation
                            </Button>
                            <Button variant="link" className="p-0 h-auto">
                                <Copy className="w-4 h-4 mr-1" />
                                Copy invitation link
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Members Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Team Members ({allMembers.length})
                    </CardTitle>
                    <CardDescription>
                        View and manage your team members and pending invitations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search and Filters */}
                    <div className="flex items-center justify-between mb-4">
                        <Input
                            placeholder="Search members..."
                            value={globalFilter ?? ""}
                            onChange={(event) => setGlobalFilter(event.target.value)}
                            className="max-w-sm"
                        />
                        <div className="flex items-center space-x-2">
                            <Select
                                value={
                                    (table.getColumn("role")?.getFilterValue() as string) ?? "all"
                                }
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
                            <Select
                                value={
                                    (table.getColumn("status")?.getFilterValue() as string) ?? "all"
                                }
                                onValueChange={handleStatusFilterChange}
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="All status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All status</SelectItem>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="PENDING">Pending</SelectItem>
                                    <SelectItem value="DECLINED">Declined</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
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
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
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
            </Card>
        </div>
    );
};

export default OrganisationMemberList;
