"use client";

import { useProfile } from "@/hooks/useProfile";
import { FCWC, Propless } from "@/lib/interfaces/interface";

/**
 * Centralised Wrapper Component to Handle all the Onboarding Process
 *
 * Will handle the core onboarding with a mandatory flow for the user to complete
 *
 */
export const OnboardWrapper: FCWC<Propless> = ({ children }) => {
    const { data: user, isLoading, isLoadingAuth } = useProfile();

    // Wait for auth & profile to finish before deciding what to show
    if (isLoading || isLoadingAuth) {
        return null; // or <Skeleton className="h-screen w-full" />
    }

    // New user accounts wont have a name, indicating they haven't completed onboarding
    if (!user || user.name) return <>{children}</>;
};
