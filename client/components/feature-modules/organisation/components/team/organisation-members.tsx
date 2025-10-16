"use client";

import { Card } from "@/components/ui/card";
import { useOrganisation } from "@/hooks/useOrganisation";
import { isResponseError } from "@/lib/util/error/error.util";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { InviteTable } from "./invite-table";
import { MemberTable } from "./member-table";
import InviteMemberForm from "./organisation-invite";

const OrganisationMemberList = () => {
    const { data: organisation, isPending, isLoadingAuth, error } = useOrganisation();
    const loading = isPending || isLoadingAuth;
    const router = useRouter();

    useEffect(() => {
        // Query has finished, organisaiton has not been found. Redirect back to organisation view with associated error
        if (!isPending && !isLoadingAuth && !organisation) {
            if (!error || !isResponseError(error)) {
                router.push("/dashboard/organisation/");
                return;
            }

            // Query has returned an ID we can use to route to a valid error message
            const responseError = error;
            router.push(`/dashboard/organisation?error=${responseError.error}`);
        }
    }, [loading, organisation, error, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-2 text-muted-foreground">Loading team members...</p>
                </div>
            </div>
        );
    }
    if (!organisation) return;

    return (
        <div className="space-y-6 m-12">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Team Settings - Invite Members</h1>
                    <p className="text-muted-foreground">
                        Manage and view your coworkers and guests
                    </p>
                </div>
            </div>
            <Card>
                <InviteMemberForm organisation={organisation} />
            </Card>
            {/* Invites */}
            <Card className="bg-transparent">
                <InviteTable invites={organisation.invites} />
            </Card>
            {/* Members */}
            <Card className="bg-transparent">
                <MemberTable members={organisation.members} />
            </Card>
        </div>
    );
};

export default OrganisationMemberList;
