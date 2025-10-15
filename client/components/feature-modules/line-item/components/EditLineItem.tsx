import { LineItem } from "@/components/feature-modules/invoice/interface/invoice.interface";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetTitle,
} from "@/components/ui/sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC } from "react";
import { useForm } from "react-hook-form";
import LineItemForm, { LineItemCreation, LineItemFormSchema } from "./LineItemForm";

interface Props {
    item: LineItem;
    onSubmit: (values: LineItemCreation) => Promise<void>;
    onClose: () => void;
}

const EditLineItem: FC<Props> = ({ item, onSubmit, onClose }) => {
    const form = useForm<LineItemCreation>({
        resolver: zodResolver(LineItemFormSchema),
        defaultValues: {
            name: item.name,
            description: item.description || "",
            chargeRate: item.chargeRate,
            type: item.type,
        },
        mode: "onBlur",
    });

    return (
        <Sheet open={true} modal={true}>
            <SheetContent
                side={"left"}
                hideClose={true}
                className="w-full lg:w-2/3 xl:w-1/2 sm:max-w-none lg:max-w-none overflow-y-auto flex flex-col p-8 md:px-16 md:py-20"
            >
                <SheetTitle>Edit Item Details</SheetTitle>
                <SheetDescription>
                    Update the details for <span className="font-semibold">{item.name}</span>.
                    <br />
                    Ensure all information is accurate before saving.
                </SheetDescription>
                <LineItemForm
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
                                Edit Item
                            </Button>
                        </SheetFooter>
                    )}
                />
            </SheetContent>
        </Sheet>
    );
};

export default EditLineItem;
