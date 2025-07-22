import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import FormCountrySelector from "@/components/ui/forms/country/country-selector";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TextSeparator } from "@/components/ui/text-separator";
import { ClientTemplateFieldStructure } from "@/lib/interfaces/template.interface";
import { FC } from "react";
import { Path, UseFormReturn } from "react-hook-form";
import { Country } from "react-phone-number-input";
import { ClientCreation } from "./ClientForm";

export const RenderClientField: FC<{
    field: ClientTemplateFieldStructure;
    form: UseFormReturn<ClientCreation>;
    path: string;
}> = ({ field, form, path }) => {
    const handleCountrySelection = (fieldPath: string, country: Country) => {
        const currentValue = form.getValues(fieldPath as Path<ClientCreation>);
        const newValue = { ...currentValue, country };
        form.setValue(fieldPath as Path<ClientCreation>, newValue);
    };

    if (field.type === "OBJECT") {
        return (
            <div className="ml-4 border-l-2 pl-4">
                <TextSeparator>
                    <span className="text-[1rem] leading-1 font-semibold">{field.name}</span>
                </TextSeparator>
                {field.children.map((child) => (
                    <RenderClientField
                        key={`${path}.${child.name}`}
                        field={child}
                        form={form}
                        path={`${path}.${child.name}`}
                    />
                ))}
            </div>
        );
    }

    return (
        <FormField
            control={form.control}
            name={path as Path<ClientCreation>}
            render={({ field: formField }) => (
                <FormItem className="mt-6 w-full">
                    <FormLabel className="font-semibold">
                        {field.name} {field.required ? "*" : ""}
                    </FormLabel>
                    <FormControl>
                        {field.type === "TEXT" && field.name.toLowerCase().includes("email") ? (
                            <Input
                                {...formField}
                                type="email"
                                placeholder={field.description || field.name}
                            />
                        ) : field.type === "TEXT" && field.name.toLowerCase().includes("phone") ? (
                            <PhoneInput
                                {...formField}
                                placeholder="0455 555 555"
                                defaultCountry="AU"
                            />
                        ) : field.type === "TEXT" &&
                          field.name.toLowerCase().includes("country") ? (
                            <FormCountrySelector
                                key={path}
                                value={formField.value as Country}
                                handleSelection={handleCountrySelection}
                            />
                        ) : field.type === "NUMBER" ? (
                            <Input
                                {...formField}
                                type="number"
                                placeholder={field.description || field.name}
                            />
                        ) : field.type === "DATE" ? (
                            <Input
                                {...formField}
                                type="date"
                                placeholder={field.description || field.name}
                            />
                        ) : field.type === "BOOLEAN" ? (
                            <Checkbox
                                checked={formField.value}
                                onCheckedChange={formField.onChange}
                            />
                        ) : field.type === "SELECT" ? (
                            <Select onValueChange={formField.onChange} value={formField.value}>
                                <SelectTrigger>
                                    <SelectValue placeholder={`Select ${field.name}`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {field.options.map((option) => (
                                        <SelectItem key={option} value={option}>
                                            {option}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : field.type === "MULTISELECT" ? (
                            <div>
                                {field.options.map((option) => (
                                    <div key={option} className="flex items-center space-x-2">
                                        <Checkbox
                                            checked={(formField.value || []).includes(option)}
                                            onCheckedChange={(checked) => {
                                                const current = formField.value || [];
                                                const updated = checked
                                                    ? [...current, option]
                                                    : current.filter((v: string) => v !== option);
                                                formField.onChange(updated);
                                            }}
                                        />
                                        <span>{option}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Input {...formField} placeholder={field.description || field.name} />
                        )}
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
