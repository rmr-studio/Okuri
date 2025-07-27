import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { StatusIcon } from "@/components/ui/status";
import { Organisation } from "@/lib/interfaces/organisation.interface";
import { toTitleCase } from "@/lib/util/utils";
import { FC } from "react";

interface Props {
    organisation: Organisation;
}

export const OrganisationHeader: FC<Props> = ({ organisation }) => {
    return (
        <header className="py-12 px-8 w-fit">
            <section className="w-fit flex items-end space-x-2">
                <h1 className="text-3xl font-semibold text-primary/90">
                    {organisation.name}
                </h1>
                <Badge className="mb-1" variant={"outline"}>
                    {toTitleCase(organisation.plan)}
                </Badge>
                <Badge className="mb-1" variant={"outline"}>
                    <StatusIcon status="healthy" />
                    <span className="ml-1 ">Cluster Status</span>
                </Badge>
            </section>
            <Separator className="my-4" />
            <section className="flex h-6 space-x-3 items-center">
                <div className="text-sm text-content">
                    <span className="font-semibold">
                        {organisation.memberCount}{" "}
                    </span>
                    member
                    {organisation.memberCount > 1 && "s"}
                </div>
                <Separator orientation="vertical" />
                <div className="text-sm text-content">
                    <span className="font-semibold">{3} </span>
                    active invites
                </div>
                <Separator orientation="vertical" />
                <div className="text-sm text-content">
                    <span className="font-semibold">{2} </span>
                    clusters
                </div>
                <Separator orientation="vertical" />
                <div className="text-sm text-content">
                    <span className="font-semibold">{8} </span>
                    active topics
                </div>
                <Separator orientation="vertical" />
                <div className="text-sm text-content">
                    <span className="font-semibold">{184} </span>
                    outgoing routes
                </div>
            </section>
        </header>
    );
};
