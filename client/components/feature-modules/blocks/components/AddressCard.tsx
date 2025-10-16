import { Address } from "@/lib/interfaces/common.interface";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { FC, ReactNode } from "react";

interface Props {
    address?: Partial<Address>;
    title?: string;
    description?: string;
    footer?: ReactNode;
    slots?: Record<string, ReactNode>;
}

export const AddressCard: FC<Props> = ({ address, title = "Address", description, footer }) => {
    const { street, city, state, postalCode, country } = address ?? {};
    const location = [city, state, postalCode].filter(Boolean).join(", ");

    return (
        <Card className="transition-shadow duration-150 hover:shadow-lg">
            <CardHeader>
                <CardTitle className="text-base font-semibold">{title}</CardTitle>
                {description ? <CardDescription>{description}</CardDescription> : null}
            </CardHeader>
            <CardContent className="space-y-1 text-sm text-foreground">
                {street ? <div>{street}</div> : null}
                {location ? <div>{location}</div> : null}
                {country ? <div>{country}</div> : null}
            </CardContent>
            {footer ? <CardFooter className="text-sm text-muted-foreground">{footer}</CardFooter> : null}
        </Card>
    );
};
