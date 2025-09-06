"use client";

import { useAuth } from "@/components/provider/auth-context";
import { useOrganisationStore } from "@/components/provider/OrganisationContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import List01 from "@/components/ui/organisation/list01";
import List02 from "@/components/ui/organisation/list02";
import List03 from "@/components/ui/organisation/list03";
import { useOrganisation } from "@/hooks/useOrganisation";
import { useOrganisationRole } from "@/hooks/useOrganisationRole";
import { isResponseError } from "@/lib/util/error/error.util";
import { Calendar, CreditCard, Edit, Trash2, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const OrganisationDashboard = () => {
    const { data: organisation, isPending, error, isLoadingAuth } = useOrganisation();
    const { hasRole } = useOrganisationRole();

    const { session } = useAuth();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const router = useRouter();
    const selectedOrganisationId = useOrganisationStore((store) => store.selectedOrganisationId);
    const setSelectedOrganisation = useOrganisationStore((store) => store.setSelectedOrganisation);

    useEffect(() => {
        // Query has finished, organisation has not been found. Redirect back to organisation view with associated error
        if (!isPending && !isLoadingAuth && !organisation) {
            if (!error || !isResponseError(error)) {
                router.push("/dashboard/organisation/");
                return;
            }

            // Query has returned an ID we can use to route to a valid error message
            const responseError = error;
            router.push(`/dashboard/organisation?error=${responseError.error}`);
        }
    }, [isPending, isLoadingAuth, organisation, error, router]);

    useEffect(() => {
        if (!organisation || !setSelectedOrganisation) return;
        if (selectedOrganisationId === organisation.id) return;
        setSelectedOrganisation(organisation); // Pass the full Organisation object
    }, [organisation, selectedOrganisationId, setSelectedOrganisation]);

    if (isPending || isLoadingAuth) {
        return <div>Loading...</div>;
    }

    const onEdit = () => {
        if (!organisation?.id) return;
        router.push(`/dashboard/organisation/${organisation.id}/edit`);
    };

    if (!organisation) return;

    return (
        <div className="space-y-4 m-12">
            <section>
                <Card className="bg-transparent">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between space-x-4">
                        <div className="bg-muted h-48 w-full rounded-lg" />
                        <div className="bg-muted h-48 w-full rounded-lg" />
                        <div className="bg-muted h-48 w-full rounded-lg" />
                        <div className="bg-muted h-48 w-full rounded-lg" />
                        {hasRole("ADMIN") && (
                            <div className="h-48 min-w-32 rounded-lg">
                                <Button
                                    onClick={onEdit}
                                    className="justify-center flex flex-grow border-edit cursor-pointer w-full mb-2"
                                    variant="outline"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                                {hasRole("OWNER") && (
                                    <Button
                                        onClick={() => setShowDeleteModal(true)}
                                        className="justify-center flex flex-grow border-destructive cursor-pointer w-full h-fit"
                                        variant="outline"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            </section>

            <section className="bg-white dark:bg-[#0F0F12] rounded-xl p-6 flex flex-col items-start justify-start border border-gray-200 dark:border-[#1F1F23]">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-zinc-900 dark:text-zinc-50" />
                    Upcoming Events
                </h2>
                <List03 />
            </section>
        </div>
    );
};
