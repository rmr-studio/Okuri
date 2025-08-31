import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { FC } from "react";
import { toast } from "sonner";
import { ClientStepFormProps } from "./client-form";

export const ClientDetailsFormStep: FC<ClientStepFormProps> = ({ form, handleNextPage }) => {
    const onNext = async () => {
        // Handle internal validation for all fields specific to this step
        const isValid = await form.trigger([
            "name",
            "contactDetails.email",
            "contactDetails.phone",
            "contactDetails.address.city",
            "contactDetails.address.street",
            "contactDetails.address.state",
            "contactDetails.address.postalCode",
            "contactDetails.address.country",
        ]);
        if (!isValid) {
            toast.error("Some fields are missing required values");
            return;
        }

        // If valid, proceed to the next step
        handleNextPage("attributes");
    };

    return (
        <>
            <CardContent className="space-y-6">
                <section>
                    <h3 className="text-lg font-semibold mb-1">Contact Details</h3>
                    <p className="text-sm text-muted-foreground mb-2 max-w-lg">
                        Provide some basic information about your organisation. You can update these
                        details later in your organisation settings.
                    </p>
                </section>
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">Client Name *</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Enter client name" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="contactDetails.email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">Email</FormLabel>
                            <FormControl>
                                <Input {...field} type="email" placeholder="client@example.com" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="contactDetails.phone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">Phone</FormLabel>
                            <FormControl>
                                <PhoneInput
                                    {...field}
                                    placeholder="0455 555 555"
                                    defaultCountry="AU"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter className="flex justify-end mt-4 py-1 border-t ">
                <Button type="button" size={"sm"} className="cursor-pointer" onClick={onNext}>
                    Next Page
                </Button>
            </CardFooter>
        </>
    );
};
