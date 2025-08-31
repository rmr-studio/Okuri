import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import FormCountrySelector from "@/components/ui/forms/country/country-selector";
import { Input } from "@/components/ui/input";
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
            "contactDetails.address",
            "contactDetails.address.city",
            "contactDetails.address.state",
            "contactDetails.address.postalCode",
            "contactDetails.address.country",
        ]);
        if (!isValid) {
            toast.error("Please fill in all required address fields");
            return;
        }

        handleNextPage("attributes");
    };

    return (
        <>
            <CardContent className="pb-8">
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Provide your organisation's address to be used for billing, invoice
                        generation and official documents
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="contactDetails.address.street"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Street Address *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Street Address" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactDetails.address.city"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>City *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactDetails.address.state"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>State/Province *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="State" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactDetails.address.postalCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Postal Code *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Postal Code" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactDetails.address.country"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Country *</FormLabel>
                                    <FormControl>
                                        <FormCountrySelector
                                            key="country"
                                            value={field.value as Country}
                                            handleSelection={(country) => {
                                                field.onChange(country);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between mt-4 py-1 border-t">
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
            </CardFooter>
        </>
    );
};
