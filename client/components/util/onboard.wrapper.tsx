"use client";

import { useProfile } from "@/hooks/useProfile";
import { Propless } from "@/lib/interfaces/interface";
import { FC } from "react";
import { OnboardForm } from "../feature-modules/onboarding/OnboardForm";
import { SheetContent } from "../ui/sheet";

/**
 * Centralised Wrapper Component to Handle all the Onboarding Process
 *
 * Will handle the core onboarding with a mandatory flow for the user to complete
 *
 */
export const OnboardPrompt: FC<Propless> = () => {
    const { data: user } = useProfile();

    // // New user accounts wont have a name, indicating they haven't completed onboarding
    if (!user || user.name) return null;

    return (
        <SheetContent>
            <OnboardForm user={user} />;
        </SheetContent>
    );
};
