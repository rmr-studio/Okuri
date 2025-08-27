import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import FormCountrySelector from "@/components/ui/forms/country/country-selector";
import { Input } from "@/components/ui/input";
import { FC } from "react";
import { Country } from "react-phone-number-input";
import { toast } from "sonner";
import { OrganisationStepFormProps } from "../OrganisationForm";

const OrganisationBillingForm: FC<OrganisationStepFormProps> = ({
    form,
    handlePreviousPage,
    handleNextPage,
}) => {
    const onNext = async () => {
        // Validate required address fields

        const isValid = await form.trigger([
            "address.street",
            "address.city",
            "address.state",
            "address.postalCode",
            "address.country",
            "payment.accountName",
            "payment.bsb",
            "payment.accountNumber",
        ]);
        if (!isValid) {
            toast.error("Please fill in all required address fields");
            return;
        }

        handleNextPage("custom");
    };

    const onBack = () => {
        handlePreviousPage("base");
    };

    return (
        <>
            <CardContent className="pb-8">
                {/* Address Section */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Address Information</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                        Provide your organisation's address to be used for billing, invoice
                        generation and official documents
                    </p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="address.street"
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
                            name="address.city"
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
                            name="address.state"
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
                            name="address.postalCode"
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
                            name="address.country"
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

                {/* Payment Details Section */}
                <div className="mt-6">
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold">Payment Details (Optional)</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Provide your organisation's payment details for invoicing and report
                            generation purposes.
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="payment.bsb"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>BSB</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="000-000"
                                                {...field}
                                                onChange={(e) => {
                                                    const value = e.target.value.replace(
                                                        /[^0-9]/g,
                                                        ""
                                                    );
                                                    if (value.length <= 6) {
                                                        const formatted = value.replace(
                                                            /(\d{3})(\d{0,3})/,
                                                            "$1-$2"
                                                        );
                                                        field.onChange(formatted);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="payment.accountNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Number</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Account Number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="payment.accountName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Account Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Account Name" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between mt-4 py-1 border-t">
                <Button type="button" size={"sm"} className="cursor-pointer" onClick={onBack}>
                    Previous Page
                </Button>
                <Button type="button" size={"sm"} className="cursor-pointer" onClick={onNext}>
                    Next Page
                </Button>
            </CardFooter>
        </>
    );
};

export default OrganisationBillingForm;
