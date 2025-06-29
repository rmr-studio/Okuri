import { CountryEntry, CountrySelect } from "@/components/ui/country-select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { TextSeparator } from "@/components/ui/text-separator";
import { countryCodeToName } from "@/lib/util/country/country.util";
import { FC, useEffect, useState } from "react";
import { Control, UseFormSetValue } from "react-hook-form";
import { Country, getCountries } from "react-phone-number-input";
import { UserOnboard } from "../OnboardForm";

interface Props {
    control: Control<UserOnboard>;
    setValue: UseFormSetValue<UserOnboard>;
}

const OnboardUserForm: FC<Props> = ({ control, setValue }) => {
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
        <>
            <section className="my-4">
                <TextSeparator>
                    <span className="text-[1rem] leading-1 font-semibold">Your details</span>
                </TextSeparator>
                <div className="flex flex-col lg:flex-row md:space-x-4">
                    <FormField
                        control={control}
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
                        control={control}
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
            </section>
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
        </>
    );
};

export default OnboardUserForm;
