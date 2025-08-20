"use client";

import { useOrganisationStore } from "@/components/provider/OrganisationContent";
import { useOrganisation } from "@/hooks/useOrganisation";
import { isResponseError, ResponseError } from "@/lib/util/error/error.util";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { OrganisationHeader } from "./OrganisationHeader";

export const OrganisationDashboard = () => {
    const { data, isPending, isError, error, isLoadingAuth } = useOrganisation();
    const selectedOrganisationId = useOrganisationStore((store) => store.selectedOrganisationId);
    const setSelectedOrganisation = useOrganisationStore((store) => store.setSelectedOrganisation);
    const router = useRouter();

    useEffect(() => {
        // Query has finished, organisaiton has not been found. Redirect back to organisation view with associated error
        if (!isPending && !isLoadingAuth && !data) {
            if (!error || !isResponseError(error)) {
                router.push("/dashboard/organisation/");
                return;
            }

            // Query has returned an ID we can use to route to a valid error message
            const responseError = error as ResponseError;
            router.push(`/dashboard/organisation?error=${responseError.error}`);
        }
    }, [isPending, isLoadingAuth, data, error, router]);

    useEffect(() => {
        if (!data || !setSelectedOrganisation) return;
        if (selectedOrganisationId === data.id) return;
        setSelectedOrganisation(data); // Pass the full Organisation object
    }, [data, selectedOrganisationId, setSelectedOrganisation]);

    if (isPending || isLoadingAuth) {
        return <div>Loading...</div>;
    }

    if (!data) return;

    return (
        <>
            <OrganisationHeader organisation={data} />
        </>
    );
};
