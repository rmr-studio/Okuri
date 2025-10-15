"use client";

import { MembershipDetails } from "@/components/feature-modules/organisation/interface/organisation.interface";
import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { OrganisationTile } from "../components/organisation-card";

export const OrganisationPicker = () => {
    const { data: user, isPending } = useProfile();

    const [organisationSearch, setOrganisationSearch] = useState<string>("");
    const [renderedOrganisations, setRenderedOrganisations] = useState<MembershipDetails[]>([]);
    useEffect(() => {
        if (user?.memberships) {
            setRenderedOrganisations(
                user.memberships.filter((org) =>
                    org.organisation?.name
                        .toLowerCase()
                        .includes(organisationSearch?.toLowerCase() || "")
                )
            );
        } else {
            setRenderedOrganisations([]);
        }
    }, [user, organisationSearch]);

    return (
        <>
            <section className="flex mt-6 space-x-4">
                <Input
                    className="w-full max-w-sm"
                    placeholder="Search Organisations"
                    value={organisationSearch ?? ""}
                    onChange={(e) => {
                        setOrganisationSearch(e.target.value);
                        if (user?.memberships) {
                            setRenderedOrganisations(
                                user.memberships.filter((org) =>
                                    org.organisation?.name
                                        .toLowerCase()
                                        .includes(e.target.value.toLowerCase())
                                )
                            );
                        }
                    }}
                />

                <Link href={"/dashboard/organisation/new"}>
                    <Button variant={"outline"} size={"sm"} className="h-full cursor-pointer">
                        <PlusCircle className="mr-2" />
                        Create Organisation
                    </Button>
                </Link>
            </section>
            <section className="flex flex-wrap flex-shrink-0 mt-8 space-x-4">
                {renderedOrganisations.length > 0 ? (
                    <>
                        {renderedOrganisations.map(
                            (org) =>
                                org.organisation?.id && (
                                    <OrganisationTile
                                        key={org.organisation.id}
                                        membership={org}
                                        isDefault={
                                            user?.defaultOrganisation?.id === org.organisation.id
                                        }
                                    />
                                )
                        )}
                    </>
                ) : isPending ? (
                    <>Loading... </>
                ) : (
                    <>No Organisations found</>
                )}
            </section>
        </>
    );
};
