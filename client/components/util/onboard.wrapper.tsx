"use client";

import { useProfile } from "@/hooks/useProfile";
import { FCWC, Propless } from "@/lib/interfaces/interface";
import { Onboard } from "../feature-modules/onboarding/Onboard";

/**
 * Centralised Wrapper Component to Handle all the Onboarding Process
 *
 * Will handle the core onboarding with a mandatory flow for the user to complete
 *
 */
export const OnboardWrapper: FCWC<Propless> = ({ children }) => {
    const { data: user } = useProfile();

    // New user accounts wont have a name, indicating they haven't completed onboarding
    if (!user || user.name) return <>{children}</>;

    return <Onboard />;
};
