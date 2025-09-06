import { countryCodeToName } from "@/lib/util/country/country.util";
import { useEffect, useState } from "react";
import { Control, FieldValues, Path } from "react-hook-form";
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

export type AddressFormData = z.infer<typeof AddressFormSchema>;

// Helper type to ensure the field path points to an address object
type AddressFieldPath<T extends FieldValues> = {
    [K in Path<T>]: T[K] extends AddressFormData ? K : never;
}[Path<T>];

interface Props<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>;
    basePath: AddressFieldPath<TFieldValues> | string; // fallback to string for flexibility
    setValue: (name: Path<TFieldValues>, value: any) => void;
    defaultCountry?: Country;
}

export const AddressForm = <TFieldValues extends FieldValues>({
    control,
    basePath,
    setValue,
    defaultCountry = "AU",
}: Props<TFieldValues>) => {
    const [selectedCountry, setSelectedCountry] = useState<Country>(defaultCountry);
    const [countries, setCountries] = useState<CountryEntry[]>([]);

    const getFieldPath = (field: keyof AddressFormData): Path<TFieldValues> => {
        return `${basePath}.${field}` as Path<TFieldValues>;
    };

    const handleCountrySelection = (country: Country) => {
        setSelectedCountry(country);
        setValue(getFieldPath("country"), country);
    };

    useEffect(() => {
        const countriesList: CountryEntry[] = getCountries().map((country) => ({
            label: countryCodeToName[country as Country],
            value: country,
        }));

        setCountries(countriesList);
        setValue(getFieldPath("country"), selectedCountry);
    }, [setValue, basePath, selectedCountry]);

    return (
        <section className="space-y-6">
            <TextSeparator>
                <span className="text-[1rem] leading-1 font-semibold">Address</span>
            </TextSeparator>

            <FormField
                control={control}
                name={getFieldPath("street")}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel className="font-semibold">Address *</FormLabel>
                        <FormControl>
                            <Input placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={getFieldPath("city")}
                    render={({ field }) => (
                        <FormItem>
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
                    name={getFieldPath("state")}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">State *</FormLabel>
                            <FormControl>
                                <Input placeholder="State/Province" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <FormField
                    control={control}
                    name={getFieldPath("country")}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">Country *</FormLabel>
                            <FormControl>
                                <CountrySelect
                                    {...field}
                                    value={selectedCountry}
                                    onChange={handleCountrySelection}
                                    includePhoneCode={false}
                                    showCountryName={true}
                                    options={countries}
                                    className="w-full rounded-md border"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={control}
                    name={getFieldPath("postalCode")}
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="font-semibold">Postal Code *</FormLabel>
                            <FormControl>
                                <Input placeholder="Postal/ZIP code" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        </section>
    );
};
