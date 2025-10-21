import { Client } from "@/components/feature-modules/client/interface/client.interface";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInitials } from "@/lib/util/utils";
import Link from "next/link";
import { FC, ReactNode } from "react";

interface AccountSummary {
    entityId: string;
    name?: string;
    domain?: string;
}

interface Props {
    client?: Pick<Client, "id" | "name" | "contact" | "company" | "archived" | "type"> & {
        organisationId?: string;
    };
    accounts?: AccountSummary[];
    href?: string;
    avatarUrl?: string;
    avatarShape?: "circle" | "square";
    slots?: Record<string, ReactNode>;
}

export const ContactCard: FC<Props> = ({ client, accounts, href, avatarUrl, avatarShape }) => {
    const name = client?.name ?? "Unnamed client";
    const email = client?.contact?.email ?? "No email";
    const phone = client?.contact?.phone;
    const companyName = client?.company?.name;
    const account = accounts?.[0];

    const body = (
        <Card className="transition-shadow duration-150 hover:shadow-lg">
            <CardHeader className="flex flex-row items-center gap-4">
                <Avatar className={avatarShape === "square" ? "rounded-md" : "rounded-full"}>
                    <AvatarImage src={avatarUrl ?? undefined} alt={name} />
                    <AvatarFallback>{getInitials(name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{name}</CardTitle>
                    <CardDescription className="truncate">{email}</CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
                {phone ? <div className="font-medium text-foreground">{phone}</div> : null}
                {companyName ? (
                    <div>
                        <div className="uppercase text-xs font-semibold tracking-wide text-muted-foreground">
                            Company
                        </div>
                        <div className="text-foreground">{companyName}</div>
                    </div>
                ) : null}
                {account ? (
                    <div>
                        <div className="uppercase text-xs font-semibold tracking-wide text-muted-foreground">
                            Linked Account
                        </div>
                        <div className="text-foreground">
                            {account.name ?? account.domain ?? account.entityId}
                        </div>
                    </div>
                ) : null}
                {client?.type ? (
                    <div>
                        <div className="uppercase text-xs font-semibold tracking-wide text-muted-foreground">
                            Type
                        </div>
                        <div className="text-foreground">{client.type}</div>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );

    if (href) {
        return (
            <Link href={href} className="block">
                {body}
            </Link>
        );
    }

    return <div className="block">{body}</div>;
};
