"use client";

import { useOrganisationStore } from "@/components/provider/OrganisationContent";
import List01 from "@/components/ui/organisation/list01";
import List02 from "@/components/ui/organisation/list02";
import List03 from "@/components/ui/organisation/list03";
import { useOrganisation } from "@/hooks/useOrganisation";
import { isResponseError, ResponseError } from "@/lib/util/error/error.util";
import { Calendar, CreditCard, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
        <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
                        <Wallet className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
                        Accounts
                    </h2>
                    <div className="flex-1">
                        <List01 className="h-full" />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col border border-gray-200 dark:border-[#1F1F23]">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
                        <CreditCard className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
                        Recent Transactions
                    </h2>
                    <div className="flex-1">
                        <List02 className="h-full" />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col items-start justify-start border border-gray-200 dark:border-[#1F1F23]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
                    Upcoming Events
                </h2>
                <List03 />
            </div>
        </div>
    );
};
