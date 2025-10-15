import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/util/utils";
import Link from "next/link";
import { FC } from "react";

interface Props {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    href: string;
}

export const ContactCard: FC<Props> = (p) => (
    <Link
        href={p.href}
        className="block hover:shadow-lg transition-shadow duration-150 ease-in-out"
    >
        <div className="rounded-xl border p-4 shadow-sm flex">
            <div>
                <Avatar>
                    <AvatarImage src={p.avatarUrl} alt={p.name} />
                    <AvatarFallback>{getInitials(p.name)}</AvatarFallback>
                </Avatar>
            </div>
            <div>
                <div className="text-lg font-semibold">{p.name ?? "-"}</div>
                <div className="text-sm opacity-80">{p.email ?? "-"}</div>
            </div>
        </div>
    </Link>
);
