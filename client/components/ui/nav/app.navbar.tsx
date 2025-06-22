"use client";

import { useProfile } from "@/hooks/useProfile";
import { SidebarTrigger } from "../sidebar";
import { NavbarLogo, NavbarUserProfile, NavbarWrapper } from "./navbar.content";

export const AppNavbar = () => {
    const {isLoadingAuth: _, ...query} = useProfile();
    return (
        <NavbarWrapper>
            <SidebarTrigger className="mr-4 cursor-pointer" />
            <NavbarLogo href="/dashboard" />

            <div className="flex w-auto flex-grow justify-end mr-2">
                <NavbarUserProfile {...query} />
            </div>
        </NavbarWrapper>
    );
};
