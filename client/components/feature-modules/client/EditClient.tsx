import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Client } from "@/lib/interfaces/client.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { ClientCreation, ClientForm, ClientFormSchema } from "./ClientForm";

interface Props {
    client: Client;
    onSubmit: (values: ClientCreation) => Promise<void>;
    onClose: () => void;
}

const EditClient: FC<Props> = ({ client, onSubmit }) => {
    const form = useForm<ClientCreation>({
        resolver: zodResolver(ClientFormSchema),
        defaultValues: {
            displayName: client.name,
            phone: client.phone,
            street: client.address.street,
            city: client.address.city,
            state: client.address.state,
            country: client.address.country,
            postalCode: client.address.postalCode,
            ndisNumber: client.ndisNumber || "",
        },
        mode: "onBlur",
    });

    return (
        <Sheet open={true} modal={true}>
            <SheetContent
                side={"left"}
                className="w-full lg:w-1/2 sm:max-w-none lg:max-w-none overflow-y-auto flex flex-col p-8 md:px-16 md:py-20"
            >
                <ClientForm form={form} handleSubmission={onSubmit} />
            </SheetContent>
        </Sheet>
    );
};

export default EditClient;
