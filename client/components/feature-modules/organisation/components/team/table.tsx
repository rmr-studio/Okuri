import {
    OrganisationInvite,
    OrganisationMember,
    OrganisationRole,
} from "@/components/feature-modules/organisation/interface/organisation.interface";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/util/utils";
import { format } from "date-fns";
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Copy,
    MoreHorizontal,
    Settings,
    Shield,
    Trash2,
    User,
} from "lucide-react";
import { FC, memo } from "react";

// Status display mapping - moved outside component to prevent recreation
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
    Active: {
        label: "Active",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
    },
} as const;

// Role display mapping - moved outside component to prevent recreation
const roleDisplayMap = {
    OWNER: { label: "Owner", color: "bg-red-100 text-red-800", icon: Shield },
    ADMIN: { label: "Admin", color: "bg-blue-100 text-blue-800", icon: Shield },
    MEMBER: {
        label: "Member",
        color: "bg-green-100 text-green-800",
        icon: User,
    },
} as const;

// Helper components
export const RoleCell = memo(({ role }: { role: string }) => {
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

export const StatusCell = memo(({ status }: { status: string }) => {
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

export const MemberCell = memo(({ member }: { member: OrganisationMember }) => (
    <div className="flex items-center space-x-3">
        <Avatar className="h-8 w-8">
            <AvatarImage src={member.user.avatarUrl} />
            <AvatarFallback>{getInitials(member.user.name)}</AvatarFallback>
        </Avatar>
        <div>
            <div className="font-medium">{member.user.name}</div>
            <div className="text-sm text-muted-foreground">{member.user.email}</div>
        </div>
    </div>
));

export const DateCell = memo(({ date, type }: { date: string; type: "member" | "invited" }) => {
    const dateObj = new Date(date);
    const isInvited = type === "invited";

    return (
        <div className="text-sm text-muted-foreground">
            {isInvited ? "Invited" : "Joined"} {format(dateObj, "MMM dd, yyyy")}
        </div>
    );
});

interface MemberActionProps {
    canInvokeAction: boolean;
    member: OrganisationMember;
    onRemove: (id: string) => void;
    onUpdate: (id: string, role: OrganisationRole) => void;
}

// TODO: Add confirmation and settings modal for removal and update role based on users current position

export const MemberActionsCell: FC<MemberActionProps> = memo(
    ({ member, onRemove, onUpdate, canInvokeAction }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={!canInvokeAction}>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <>
                    <DropdownMenuItem onClick={() => onUpdate(member.user.id, "ADMIN")}>
                        <Settings className="w-4 h-4 mr-2" />
                        Change role
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => onRemove(member.user.id)}
                        className="text-red-600"
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove member
                    </DropdownMenuItem>
                </>
            </DropdownMenuContent>
        </DropdownMenu>
    )
);

interface InviteActionProps {
    invite: OrganisationInvite;
    onRevoke: (invite: OrganisationInvite) => void;
}

export const InviteActionsCell: FC<InviteActionProps> = memo(({ invite, onRevoke }) => (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            <>
                <DropdownMenuItem>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy invite link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRevoke(invite)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke invite
                </DropdownMenuItem>
            </>
        </DropdownMenuContent>
    </DropdownMenu>
));
