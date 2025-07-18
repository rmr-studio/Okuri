import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetTitle,
} from "@/components/ui/sheet";
import { Client } from "@/lib/interfaces/client.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { ClientCreation, ClientForm, ClientFormSchema } from "./form/ClientForm";

interface Props {
    client: Client;
    onSubmit: (values: ClientCreation) => Promise<void>;
    onClose: () => void;
}

const EditClient: FC<Props> = ({ client, onSubmit, onClose }) => {
    const form = useForm<ClientCreation>({
        resolver: zodResolver(ClientFormSchema),

        mode: "onBlur",
    });

    return (
        <Sheet open={true} modal={true}>
            <SheetContent
                side={"left"}
                hideClose={true}
                className="w-full lg:w-2/3 xl:w-1/2 sm:max-w-none lg:max-w-none overflow-y-auto flex flex-col p-8 md:px-16 md:py-20"
            >
                <SheetTitle>Edit Client Details</SheetTitle>
                <SheetDescription>
                    Update the details for <span className="font-semibold">{client.name}</span>.
                    <br />
                    Ensure all information is accurate before saving.
                </SheetDescription>
                <ClientForm
                    form={form}
                    handleSubmission={onSubmit}
                    renderFooter={() => (
                        <SheetFooter className="flex flex-row justify-end mt-4 pt-8 px-2 border-t ">
                            <Button
                                type="button"
                                className="cursor-pointer"
                                onClick={onClose}
                                variant={"destructive"}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" variant={"outline"} className="cursor-pointer">
                                Edit Client
                            </Button>
                        </SheetFooter>
                    )}
                />
            </SheetContent>
        </Sheet>
    );
};

export default EditClient;
