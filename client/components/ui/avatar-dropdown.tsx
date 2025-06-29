"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@/lib/interfaces/user.interface";
import { getInitials } from "@/lib/util/utils";

import { ArrowLeftToLine, Building2, Settings, User as UserIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { FaGithub } from "react-icons/fa";
import { useAuth } from "../provider/AuthContext";

interface Props {
    user: User;
}

export const UserProfileDropdown: FC<Props> = ({ user }) => {
    const { name } = user;
    const { client } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        if (!client) return;

        try {
            await client.auth.signOut();
            router.push("/");
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Avatar className="rounded-md ">
                    <AvatarFallback className="rounded-md">{getInitials(name)}</AvatarFallback>
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="px-2 mx-4 mt-1">
                <DropdownMenuGroup>
                    <DropdownMenuItem className="pointer-events-none">
                        <UserIcon />
                        <span className="ml-2 text-xs font-semibold">{user.email}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                        <Settings />
                        <span
                            className="ml-2 text-xs text-content"
                            onClick={() => router.push("/dashboard")}
                        >
                            My Dashboard
                        </span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Settings />
                        <span
                            className="ml-2 text-xs text-content"
                            onClick={() => router.push("/dashboard/settings")}
                        >
                            Account Preferences
                        </span>
                    </DropdownMenuItem>

                    <DropdownMenuItem>
                        <Building2 />
                        <span
                            className="ml-2 text-xs text-content"
                            onClick={() => router.push("/dashboard/invoices")}
                        >
                            All Invoices
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <Link href={"https://www.github.com/usepaladin"} target="_blank">
                        <DropdownMenuItem>
                            <FaGithub />

                            <span className="ml-2 text-xs text-content">Source Code</span>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    <DropdownMenuItem>
                        <ArrowLeftToLine />
                        <span
                            className="ml-2 text-xs text-content"
                            onClick={async () => handleLogout()}
                        >
                            Logout
                        </span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
