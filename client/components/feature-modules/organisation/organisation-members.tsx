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
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
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

// COMMENTED OUT FOR MOCK DATA
// import { useOrganisation, useOrganisationInvites, useInviteToOrganisation, useRevokeInvite } from "@/hooks/useOrganisation";
// import { OrganisationMember, OrganisationInvite } from "@/lib/interfaces/organisation.interface";

// Form validation schema
const inviteSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

// Role display mapping
const roleDisplayMap = {
    OWNER: { label: "Owner", color: "bg-red-100 text-red-800", icon: Shield },
    ADMIN: { label: "Admin", color: "bg-blue-100 text-blue-800", icon: Shield },
    MEMBER: {
        label: "Member",
        color: "bg-green-100 text-green-800",
        icon: User,
    },
};

// Status display mapping
const statusDisplayMap = {
    PENDING: {
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
    },
    ACCEPTED: {
        label: "Active",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
    },
    DECLINED: {
        label: "Declined",
        color: "bg-red-100 text-red-800",
        icon: AlertCircle,
    },
    EXPIRED: {
        label: "Expired",
        color: "bg-gray-100 text-gray-800",
        icon: AlertCircle,
    },
};

const OrganisationMemberList = () => {
    // COMMENTED OUT FOR MOCK DATA
    // const { data: organisation, isLoading: isLoadingOrg } = useOrganisation();
    // const { data: invites, isLoading: isLoadingInvites } = useOrganisationInvites();
    // const inviteMutation = useInviteToOrganisation();
    // const revokeMutation = useRevokeInvite();

    // Mock data for development
    const mockOrganisation = {
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

    const mockInvites = [
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

    // Mock mutations
    const mockInviteMutation = {
        mutate: (data: any) => {
            console.log("Mock invite mutation:", data);
            // Simulate success after 1 second
            setTimeout(() => {
                console.log("Mock invite success!");
            }, 1000);
        },
        isPending: false,
    };

    const mockRevokeMutation = {
        mutate: (data: any) => {
            console.log("Mock revoke mutation:", data);
            // Simulate success after 1 second
            setTimeout(() => {
                console.log("Mock revoke success!");
            }, 1000);
        },
        isPending: false,
    };

    // Use mock data instead of real data
    const organisation = mockOrganisation;
    const invites = mockInvites;
    const inviteMutation = mockInviteMutation;
    const revokeMutation = mockRevokeMutation;
    const isLoadingOrg = false;
    const isLoadingInvites = false;

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [globalFilter, setGlobalFilter] = useState("");
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        watch,
    } = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            role: "MEMBER",
        },
    });

    const watchedRole = watch("role");

    // Handle invite submission
    const onSubmit = (data: InviteFormData) => {
        inviteMutation.mutate(data);
        // Mock success handling
        setTimeout(() => {
            reset();
            setSelectedEmails([]);
        }, 1000);
    };

    // Handle revoke invite
    const handleRevokeInvite = (inviteId: string) => {
        revokeMutation.mutate({ id: inviteId });
    };

    // Combine members and invites for display
    const allMembers = React.useMemo(() => {
        const members: Array<{
            id: string;
            name: string;
            email: string;
            role: string;
            status: string;
            date: string;
            type: "member" | "invited";
            avatar?: string;
            isCurrentUser?: boolean;
        }> = [];

        // Add current members
        organisation?.members?.forEach((member: any) => {
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
        invites?.forEach((invite: any) => {
            members.push({
                id: invite.id,
                name: invite.email, // Use email as name for invites
                email: invite.email,
                role: invite.role,
                status: invite.status,
                date: invite.createdAt,
                type: "invited",
                isCurrentUser: false,
            });
        });

        return members;
    }, [organisation?.members, invites]);

    // Table columns definition
    const columns: ColumnDef<(typeof allMembers)[0]>[] = [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={table.getIsAllPageRowsSelected()}
                    onCheckedChange={(value) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
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
            cell: ({ row }) => {
                const member = row.original;
                return (
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={member.avatar} />
                            <AvatarFallback>
                                {member.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">
                                {member.email}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "role",
            header: "Role",
            cell: ({ row }) => {
                const role = row.original.role;
                const roleConfig =
                    roleDisplayMap[role as keyof typeof roleDisplayMap];

                // Handle undefined role config
                if (!roleConfig) {
                    console.warn(`Unknown role: "${role}"`, {
                        availableRoles: Object.keys(roleDisplayMap),
                    });
                    return (
                        <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-800"
                        >
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
            },
        },
        {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => {
                const status = row.original.status;
                const statusConfig =
                    statusDisplayMap[status as keyof typeof statusDisplayMap];

                // Handle undefined status config
                if (!statusConfig) {
                    console.warn(`Unknown status: "${status}"`, {
                        availableStatuses: Object.keys(statusDisplayMap),
                    });
                    return (
                        <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-800"
                        >
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
            },
        },
        {
            accessorKey: "date",
            header: "Date",
            cell: ({ row }) => {
                const date = new Date(row.original.date);
                const isInvited = row.original.type === "invited";

                return (
                    <div className="text-sm text-muted-foreground">
                        {isInvited ? "Invited" : "Joined"}{" "}
                        {format(date, "MMM dd, yyyy")}
                    </div>
                );
            },
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const member = row.original;

                return (
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
                                        onClick={() =>
                                            handleRevokeInvite(member.id)
                                        }
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
                );
            },
        },
    ];

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

    if (isLoadingOrg || isLoadingInvites) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">
                        Loading team members...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Team Settings - Invite Members
                    </h1>
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
                    <CardDescription>
                        Send invitations to new team members
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                    >
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    {...register("email")}
                                    placeholder="Add emails..."
                                    className={
                                        errors.email ? "border-red-500" : ""
                                    }
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.email.message}
                                    </p>
                                )}
                            </div>
                            <Select
                                value={watchedRole}
                                onValueChange={(value) =>
                                    reset({ ...watch(), role: value as any })
                                }
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MEMBER">
                                        Member
                                    </SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                type="submit"
                                disabled={inviteMutation.isPending}
                                className="min-w-[100px]"
                            >
                                {inviteMutation.isPending
                                    ? "Inviting..."
                                    : `Invite (1)`}
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
                        View and manage your team members and pending
                        invitations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Search and Filters */}
                    <div className="flex items-center justify-between mb-4">
                        <Input
                            placeholder="Search members..."
                            value={globalFilter ?? ""}
                            onChange={(event) =>
                                setGlobalFilter(event.target.value)
                            }
                            className="max-w-sm"
                        />
                        <div className="flex items-center space-x-2">
                            <Select
                                value={
                                    (table
                                        .getColumn("role")
                                        ?.getFilterValue() as string) ?? ""
                                }
                                onValueChange={(value) =>
                                    table
                                        .getColumn("role")
                                        ?.setFilterValue(
                                            value === "all" ? "" : value
                                        )
                                }
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="All roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All roles
                                    </SelectItem>
                                    <SelectItem value="OWNER">Owner</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="MEMBER">
                                        Member
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={
                                    (table
                                        .getColumn("status")
                                        ?.getFilterValue() as string) ?? ""
                                }
                                onValueChange={(value) =>
                                    table
                                        .getColumn("status")
                                        ?.setFilterValue(
                                            value === "all" ? "" : value
                                        )
                                }
                            >
                                <SelectTrigger className="w-32">
                                    <SelectValue placeholder="All status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All status
                                    </SelectItem>
                                    <SelectItem value="Active">
                                        Active
                                    </SelectItem>
                                    <SelectItem value="Pending">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="Declined">
                                        Declined
                                    </SelectItem>
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
                                                          header.column
                                                              .columnDef.header,
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
                                            data-state={
                                                row.getIsSelected() &&
                                                "selected"
                                            }
                                        >
                                            {row
                                                .getVisibleCells()
                                                .map((cell) => (
                                                    <TableCell key={cell.id}>
                                                        {flexRender(
                                                            cell.column
                                                                .columnDef.cell,
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
