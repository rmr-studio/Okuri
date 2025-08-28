"use client";

import { useProfile } from "@/hooks/useProfile";
import Link from "next/link";
import AuthenticateButton from "../AuthenticateButton";
import { UserProfileDropdown } from "../avatar-dropdown";

export const HomeNavbar = () => {
    const { data: profile, isLoading, isLoadingAuth } = useProfile();
    const isFetching = isLoading || isLoadingAuth;

    return (
        <header className="z-20 flex items-center justify-between p-6 relative">
            {/* Logo */}
            <div className="flex items-center">
                <svg
                    fill="currentColor"
                    viewBox="0 0 147 70"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    className="size-10 translate-x-[-0.5px] text-white"
                >
                    <path d="M56 50.2031V14H70V60.1562C70 65.5928 65.5928 70 60.1562 70C57.5605 70 54.9982 68.9992 53.1562 67.1573L0 14H19.7969L56 50.2031Z"></path>
                    <path d="M147 56H133V23.9531L100.953 56H133V70H96.6875C85.8144 70 77 61.1856 77 50.3125V14H91V46.1562L123.156 14H91V0H127.312C138.186 0 147 8.81439 147 19.6875V56Z"></path>
                </svg>
            </div>

            {/* Navigation */}
            <nav className="flex items-center space-x-2">
                <Link
                    href="#"
                    className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Features
                </Link>
                <Link
                    href="#"
                    className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Pricing
                </Link>
                <Link
                    href="#"
                    className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
                >
                    Docs
                </Link>
            </nav>

            {isFetching ? (
                <></>
            ) : !profile ? (
                <AuthenticateButton />
            ) : (
                <UserProfileDropdown user={profile} />
            )}
        </header>
    );
};
