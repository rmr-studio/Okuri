import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import FormCountrySelector from "@/components/ui/forms/country/country-selector";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { TextSeparator } from "@/components/ui/text-separator";
import { ClientTemplateFieldStructure } from "@/lib/interfaces/template.interface";
import { getTypeConstraint } from "@/lib/util/form/schema.client.util";
import { FC } from "react";
import { Path, UseFormReturn } from "react-hook-form";
import { Country } from "react-phone-number-input";
import { ClientCreation } from "./client-form";

export const RenderClientField: FC<{
    field: ClientTemplateFieldStructure;
    form: UseFormReturn<ClientCreation>;
    path: string;
}> = ({ field, form, path }) => {
    const typeConstraint = getTypeConstraint(field);

    const handleCountrySelection = (fieldPath: string, country: Country) => {
        // If TYPE === COUNTRY and schema is TEXT (string), store just the country code string
        form.setValue(fieldPath as Path<ClientCreation>, country as any, { shouldDirty: true });
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
                        {field.type === "TEXT" && typeConstraint === "EMAIL" ? (
                            <Input
                                {...formField}
                                type="email"
                                placeholder={field.description || field.name}
                            />
                        ) : field.type === "TEXT" && typeConstraint === "PHONE" ? (
                            <PhoneInput
                                {...formField}
                                placeholder="0455 555 555"
                                defaultCountry="AU"
                            />
                        ) : field.type === "TEXT" && typeConstraint === "COUNTRY" ? (
                            <FormCountrySelector
                                key={path}
                                value={formField.value as Country}
                                handleSelection={(c) => handleCountrySelection(path, c as Country)}
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
                                checked={!!formField.value}
                                onCheckedChange={(checked) => formField.onChange(Boolean(checked))}
                            />
                        ) : field.type === "SELECT" ? (
                            <ScrollArea>
                                <Select
                                    onValueChange={formField.onChange}
                                    value={formField.value ?? ""}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Select ${field.name}`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(field.options || []).map((option) => (
                                            <SelectItem key={option} value={option}>
                                                {option}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </ScrollArea>
                        ) : field.type === "MULTISELECT" ? (
                            <div className="space-y-2">
                                {(field.options || []).map((option) => {
                                    const current: string[] = Array.isArray(formField.value)
                                        ? formField.value
                                        : [];
                                    const checked = current.includes(option);
                                    return (
                                        <div key={option} className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={checked}
                                                onCheckedChange={(c) => {
                                                    const next = c
                                                        ? [...current, option]
                                                        : current.filter((v) => v !== option);
                                                    formField.onChange(next);
                                                }}
                                            />
                                            <span>{option}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Input {...formField} placeholder={field.description || field.name} />
                        )}
                    </FormControl>
                    {field.description && (
                        <p className="text-xs text-muted-foreground mt-1">{field.description}</p>
                    )}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
};
