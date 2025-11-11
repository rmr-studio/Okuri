"use client";

import { User } from "@/components/feature-modules/user/interface/user.interface";
import { useAuth } from "@/components/provider/auth-context";
import { ClassNameProps, FCWC, Propless } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { UseQueryResult } from "@tanstack/react-query";
import Link from "next/link";
import { FC } from "react";
import { UserProfileDropdown } from "../../feature-modules/user/components/avatar-dropdown";
import { Button } from "../button";
import { Skeleton } from "../skeleton";
import { ModeToggle } from "../themeToggle";

interface UserProps {
    user: User;
}

export const NavbarUserProfile: FC<UseQueryResult<User>> = ({
    data: user,
    isLoading: loadingProfile,
}) => {
    const { loading: loadingAuth } = useAuth();

    if (loadingAuth || loadingProfile) return <Skeleton className="size-8 rounded-md" />;
    if (!user) return <UnauthenticatedNavbarProfile />;
    return <AuthenticatedNavbarProfile user={user} />;
};

export const AuthenticatedNavbarProfile: FC<UserProps> = ({ user }) => {
    return <UserProfileDropdown user={user} />;
};

export const UnauthenticatedNavbarProfile: FC<Propless> = () => {
    return (
        <div className="flex">
            <Button variant={"outline"}>
                <Link href="/auth/login">Login</Link>
            </Button>
            <Button className="ml-2">
                <Link href="/auth/register">Get Started</Link>
            </Button>
        </div>
    );
};

export const NavbarWrapper: FCWC<ClassNameProps> = ({ children, className }) => {
    return (
        <div className={cn("h-[4rem] sticky top-0 flex w-auto flex-grow border-b items-center px-4 bg-background/40 backdrop-blur-[4px]", className)}>
            {children}
            <div className="flex items-center">
                <ModeToggle />
            </div>
        </div>
    );
};

interface LogoProps {
    href: string;
}

export const NavbarLogo: FC<LogoProps> = ({ href }) => {
    return (
        <Link href={href}>
            <div className="text-lg font-bold w-32">[Logo]</div>
        </Link>
    );
};
