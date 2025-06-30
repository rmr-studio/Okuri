"use client";

import { CountryEntry, CountrySelect } from "@/components/ui/country-select";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { TextSeparator } from "@/components/ui/text-separator";
import { countryCodeToName } from "@/lib/util/country/country.util";
import { FC, useEffect, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { Country, getCountries } from "react-phone-number-input";
import { isMobilePhone } from "validator";
import { z } from "zod";

export const ClientFormSchema = z.object({
    displayName: z
        .string({ required_error: "Display Name is required" })
        .min(3, "Display Name is too short"),
    phone: z.string().min(10, "Invalid Phone Number").refine(isMobilePhone),
    street: z
        .string({ required_error: "Street is required" })
        .nonempty("A street address is required"),
    city: z.string({ required_error: "City is required" }).nonempty("A city is required"),
    state: z.string({ required_error: "State is required" }).nonempty("A state is required"),
    country: z.string({ required_error: "Country is required" }).nonempty("A country is required"),
    postalCode: z
        .string({ required_error: "Postal Code is required" })
        .nonempty("A postal code is required"),
    ndisNumber: z
        .string({ required_error: "NDIS Number is required" })
        .nonempty("An NDIS number is required"),
});

export type ClientCreation = z.infer<typeof ClientFormSchema>;

interface Props {
    form: UseFormReturn<ClientCreation>;
    handleSubmission: (data: ClientCreation) => Promise<void>;
}

export const ClientForm: FC<Props> = ({ form, handleSubmission }) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>("AU");
    const [countries, setCountries] = useState<CountryEntry[]>([]);

    const handleCountrySelection = (country: Country) => {
        setSelectedCountry(country);
        form.setValue("country", country);
    };

    useEffect(() => {
        const countries: CountryEntry[] = getCountries().map((country) => ({
            label: countryCodeToName[country as Country],
            value: country,
        }));

        if (!form.getValues("country")) {
            form.setValue("country", selectedCountry);
        }

        setCountries(countries);
    }, []);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmission)}>
                <section className="">
                    <TextSeparator>
                        <span className="text-[1rem] leading-1 font-semibold">Client Details</span>
                    </TextSeparator>
                    <div className="flex flex-col lg:flex-row md:space-x-4 mb-8">
                        <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem className="mt-6 w-full lg:w-3/5">
                                    <FormLabel className="font-semibold">Display Name *</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="John Doe" />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem className="mt-6 w-full lg:w-2/5">
                                    <FormLabel className="font-semibold">Phone *</FormLabel>
                                    <FormControl>
                                        <PhoneInput
                                            {...field}
                                            placeholder="0455 555 555"
                                            defaultCountry="AU"
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormField
                        control={form.control}
                        name="ndisNumber"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">NDIS Number *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="555555555" />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </section>
                <section className="my-4 flex flex-col">
                    <TextSeparator className="mb-6">
                        <span className="text-[1rem] leading-1 font-semibold">Client Address</span>
                    </TextSeparator>

                    <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                    <Input placeholder="Street" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="flex flex-col lg:flex-row md:space-x-4">
                        <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                                <FormItem className="mt-6 w-full">
                                    <FormLabel className="font-semibold">City *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="City" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="state"
                            render={({ field }) => (
                                <FormItem className="mt-6 w-full">
                                    <FormLabel className="font-semibold">State*</FormLabel>
                                    <FormControl>
                                        <Input placeholder="State" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="flex flex-col lg:flex-row md:space-x-4">
                        <FormField
                            control={form.control}
                            name="country"
                            render={({ field }) => (
                                <FormItem className="mt-6 w-full">
                                    <FormLabel className="font-semibold">Country</FormLabel>
                                    <FormControl>
                                        <div className="flex">
                                            <CountrySelect
                                                {...field}
                                                value={selectedCountry}
                                                onChange={handleCountrySelection}
                                                includePhoneCode={false}
                                                showCountryName={true}
                                                options={countries}
                                                className="w-full rounded-e-md border"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="postalCode"
                            render={({ field }) => (
                                <FormItem className="mt-6 w-full">
                                    <FormLabel className="font-semibold">Postal Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Postal Code" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </section>
            </form>
        </Form>
    );
};
