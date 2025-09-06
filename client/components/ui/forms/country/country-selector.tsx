import { countryCodeToName } from "@/lib/util/country/country.util";
import { FC, useEffect, useState } from "react";
import { Country, getCountries } from "react-phone-number-input";
import { CountryEntry, CountrySelect } from "../../country-select";

interface Props {
    handleSelection: (fieldPath: string, country: Country) => void;
    key: string;
    value: Country;
}

export const FormCountrySelector: FC<Props> = ({ value, handleSelection, key }) => {
    const [selectedCountry, setSelectedCountry] = useState<CountryEntry>({
        label: "Australia",
        value: "AU",
    });
    const [countries, setCountries] = useState<CountryEntry[]>([]);

    useEffect(() => {
        const countries: CountryEntry[] = getCountries().map((country) => ({
            label: countryCodeToName[country as Country],
            value: country,
        }));
        setCountries(countries);
    }, []);

    const handleCountrySelection = (fieldPath: string) => (country: Country) => {
        if (!country) return;
        handleSelection(fieldPath, country);
        setSelectedCountry(countries.find((c) => c.value === country) || selectedCountry);
    };

    return (
        <CountrySelect
            value={value || selectedCountry.value}
            onChange={handleCountrySelection(key)}
            includePhoneCode={false}
            showCountryName={true}
            options={countries}
            className="w-full rounded-e-md border"
        />
    );
};

export default FormCountrySelector;
