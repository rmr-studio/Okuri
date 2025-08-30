import { useAuth } from "@/components/provider/AuthContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Client } from "@/lib/interfaces/client.interface";
import { FC } from "react";

interface Props {
    client: Client | null;
    onClose: () => void;
}

const EditClientSheetView: FC<Props> = ({ client, onClose }) => {
    const { session } = useAuth();

    if (!session || !client) return null;
    return (
        <Sheet open={!!client} modal={true} onOpenChange={onClose}>
            <SheetContent
                side={"left"}
                className="w-full lg:w-2/3 xl:w-1/2 sm:max-w-none lg:max-w-none overflow-y-auto flex flex-col p-8 md:px-16 md:py-20"
            >
                <SheetTitle>Edit Client Details</SheetTitle>
                <SheetDescription>
                    Update the details for <span className="font-semibold">{client.name}</span>.
                    <br />
                    Ensure all information is accurate before saving.
                </SheetDescription>
                <Button onClick={onClose}>Close</Button>
            </SheetContent>
        </Sheet>
    );
};

export default EditClientSheetView;
