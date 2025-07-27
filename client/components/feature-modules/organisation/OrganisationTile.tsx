"use client";

import { Card, CardContent } from "@/components/ui/card";
import { OrganisationMember } from "@/lib/interfaces/organisation.interface";
import { toTitleCase } from "@/lib/util/utils";
import { ArrowRightIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

interface Props {
    membership: OrganisationMember;
    isDefault: boolean;
}

export const OrganisationTile: FC<Props> = ({ membership }) => {
    const { organisation, role, memberSince } = membership;
    if (!organisation) return null;

    return (
        <Card className="p-3 cursor-pointer hover:bg-card/60 rounded-md">
            <Link href={`/dashboard/organisation/${organisation.id}`}>
                <CardContent className="px-2 w-72">
                    <section className="flex">
                        <div className="relative w-10 h-10 overflow-hidden rounded-md bg-background/60 border mr-4">
                            <Image
                                src={organisation?.avatarUrl || "/vercel.svg"}
                                alt={`${organisation?.name} logo`}
                                fill
                                className="object-cover p-3"
                            />
                        </div>
                        <div>
                            <div className="text-sm text-content">{organisation.name}</div>
                            <div className="text-xs text-content  flex items-center">
                                <span>{toTitleCase(organisation.plan)} Plan</span>
                                <span className="mx-2 text-base">•</span>
                                <span>
                                    {organisation.memberCount} Member
                                    {organisation.memberCount > 1 && "s"}
                                </span>
                            </div>
                        </div>
                    </section>
                    <section className="mt-4 text-xs text-content flex justify-between items-end">
                        <div>
                            <div className="font-semibold">{toTitleCase(role)}</div>
                            <div>Member since {new Date(memberSince).toLocaleDateString()}</div>
                        </div>
                        <ArrowRightIcon className="w-5 h-5 text-content mb-1" />
                    </section>
                </CardContent>
            </Link>
        </Card>
    );
};
