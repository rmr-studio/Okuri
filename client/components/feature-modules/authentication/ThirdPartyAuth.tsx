"use client";

import { Button } from "@/components/ui/button";
import { SocialProviders } from "@/lib/interfaces/auth.interface";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import React from "react";
import { FaGoogle } from "react-icons/fa";

interface ThirdPartyProps extends ClassNameProps {
    iconClass?: string;
    text?: string;
    socialProviderAuthentication: (provider: SocialProviders) => Promise<void>;
}

const ThirdParty: React.FC<ThirdPartyProps> = ({
    className,
    iconClass,
    socialProviderAuthentication,
}) => {
    const handleAuth = async (provider: SocialProviders) => {
        try {
            await socialProviderAuthentication(provider);
        } catch (error) {
            console.error("Authentication failed:", error);
        }
    };

    return (
        <>
            <div className={cn("w-full flex h-fit items-center", className)}>
                <div className="h-[2px] flex flex-grow bg-foreground rounded-lg"></div>
                <div className="px-4">{"Or continue with"}</div>
                <div className="h-[2px] flex flex-grow bg-foreground rounded-lg"></div>
            </div>
            <section className=" space-y-2">
                <Button
                    onClick={async () => await handleAuth("google")}
                    variant={"outline"}
                    className="w-full relative"
                >
                    <FaGoogle className={cn("text-base", iconClass)} />
                    <span className="ml-2">Google</span>
                </Button>
            </section>
        </>
    );
};

export default ThirdParty;
