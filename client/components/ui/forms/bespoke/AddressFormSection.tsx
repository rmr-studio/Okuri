import { countryCodeToName } from "@/lib/util/country/country.util";
import { FC, useEffect, useState } from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import { Country, getCountries } from "react-phone-number-input";
import { z } from "zod";
import { CountryEntry, CountrySelect } from "../../country-select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../form";
import { Input } from "../../input";
import { TextSeparator } from "../../text-separator";

export const AddressFormSchema = z.object({
    street: z
        .string({ required_error: "Street is required" })
        .nonempty("A street address is required"),
    city: z.string({ required_error: "City is required" }).nonempty("A city is required"),
    state: z.string({ required_error: "State is required" }).nonempty("A state is required"),
    country: z.string({ required_error: "Country is required" }).nonempty("A country is required"),
    postalCode: z
        .string({ required_error: "Postal Code is required" })
        .nonempty("A postal code is required"),
});

export type AddressForm = z.infer<typeof AddressFormSchema>;

interface Props {
    control: Control<AddressForm>;
    setValue: UseFormSetValue<AddressForm>;
}

export const AddressForm: FC<Props> = ({ control, setValue }) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>("AU");
    const [countries, setCountries] = useState<CountryEntry[]>([]);

    const handleCountrySelection = (country: Country) => {
        setSelectedCountry(country);
        setValue("country", country);
    };

    useEffect(() => {
        const countries: CountryEntry[] = getCountries().map((country) => ({
            label: countryCodeToName[country as Country],
            value: country,
        }));

        setValue("country", selectedCountry);
        setCountries(countries);
    }, []);

    return (
        <section>
            <section className="my-4 flex flex-col">
                <TextSeparator>
                    <span className="text-[1rem] leading-1 font-semibold">Your Address</span>
                </TextSeparator>
                <div className="flex flex-col md:flex-row md:space-x-4"></div>
                <FormField
                    control={control}
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
                        control={control}
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
                        control={control}
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
                        control={control}
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
                        control={control}
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
        </section>
    );
};
