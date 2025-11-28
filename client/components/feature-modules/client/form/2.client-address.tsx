import { Button } from "@/components/ui/button";
import { AddressForm } from "@/components/ui/forms/bespoke/AddressFormSection";
import { FC } from "react";
import { Country } from "react-phone-number-input";
import { toast } from "sonner";
import { ClientStepFormProps } from "./client-form";

export const ClientAddressFormStep: FC<ClientStepFormProps> = ({
    form,
    handleNextPage,
    handlePreviousPage,
}) => {
    const onNext = async () => {
        // Validate required address fields
        const isValid = await form.trigger([
            "contact.address",
            "contact.address.city",
            "contact.address.state",
            "contact.address.postalCode",
            "contact.address.country",
        ]);
        if (!isValid) {
            toast.error("Please fill in all required address fields");
            return;
        }

        handleNextPage("attributes");
    };

    const onCountrySelect = (fieldPath: string, country: Country) => {
        form.setValue("contact.address.country", country);
    };

    return (
        <>
            <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                <p className="text-sm text-muted-foreground mb-6">
                    Provide your organisation's address to be used for billing, invoice generation
                    and official documents
                </p>
                <AddressForm
                    basePath="contact.address"
                    control={form.control}
                    setValue={form.setValue}
                    defaultCountry="AU"
                />
            </div>

            <footer className="flex justify-between mt-4 pt-4 border-t">
                <Button
                    type="button"
                    size={"sm"}
                    className="cursor-pointer"
                    onClick={() => handlePreviousPage("base")}
                >
                    Previous Page
                </Button>
                <Button type="button" size={"sm"} className="cursor-pointer" onClick={onNext}>
                    Next Page
                </Button>
            </footer>
        </>
    );
};
