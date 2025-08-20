import { useAuth } from "@/components/provider/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetTitle,
} from "@/components/ui/sheet";
import { Client, TemplateClientTemplateFieldStructure } from "@/lib/interfaces/client.interface";
import { useQueryClient } from "@tanstack/react-query";
import { FC, useState } from "react";
import { ClientForm } from "./form/ClientForm";

interface Props {
    client: Client;
    onClose: () => void;
}

const EditClient: FC<Props> = ({ client, onClose }) => {
    const { session } = useAuth();
    
    // TODO

    

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
                    templates={templates}
                    selectedTemplate={selectedTemplate}
                    onTemplateChange={setSelectedTemplate}
                    client={client}
                    handleSubmission={(values) => mutation.mutateAsync(values)}
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
