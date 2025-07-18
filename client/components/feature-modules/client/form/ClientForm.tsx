"use client";

import { Button } from "@/components/ui/button";
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
import { CountryEntry, CountrySelect } from "@/components/ui/country-select";
import { countryCodeToName } from "@/lib/util/country/country.util";
import { FC, JSX, useEffect, useState } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Client, ContactDetails } from "@/lib/interfaces/client.interface";
import { getCountries } from "react-phone-number-input";
import { isMobilePhone, isEmail, isDate } from "validator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ClientTemplateFieldStructure } from "@/lib/interfaces/template.interface";

// Define supported field types
type FieldType = "TEXT" | "NUMBER" | "DATE" | "BOOLEAN" | "SELECT" | "MULTISELECT" | "OBJECT";

// Dynamic Zod schema generator for recursive fields
const createDynamicSchema = (structure: Record<string, ClientTemplateFieldStructure>): z.ZodTypeAny => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    for (const [key, field] of Object.entries(structure)) {
        let schema: z.ZodTypeAny = z.any();

        switch (field.type) {
            case "TEXT":
                schema = z.string({ required_error: `${field.name} is required` });
                if (field.constraints.MIN_LENGTH) schema = schema.min(Number(field.constraints.MIN_LENGTH), `${field.name} is too short`);
                if (field.constraints.MAX_LENGTH) schema = schema.max(Number(field.constraints.MAX_LENGTH), `${field.name} is too long`);
                if (field.constraints.PATTERN) schema = schema.regex(new RegExp(field.constraints.PATTERN as string), `${field.name} is invalid`);
                break;
            case "NUMBER":
                schema = z.coerce.number({ required_error: `${field.name} is required` });
                if (field.constraints.MIN) schema = schema.min(Number(field.constraints.MIN), `${field.name} is too small`);
                if (field.constraints.MAX) schema = schema.max(Number(field.constraints.MAX), `${field.name} is too large`);
                break;
            case "DATE":
                schema = z.string({ required_error: `${field.name} is required` }).refine(isDate, `${field.name} is invalid`);
                break;
            case "BOOLEAN":
                schema = z.boolean({ required_error: `${field.name} is required` });
                break;
            case "SELECT":
                schema = z.string({ required_error: `${field.name} is required` }).refine(
                    (val) => field.options.includes(val),
                    `${field.name} must be one of: ${field.options.join(", ")}`
                );
                break;
            case "MULTISELECT":
                schema = z.array(z.string()).refine(
                    (vals) => vals.every(val => field.options.includes(val)),
                    `${field.name} contains invalid options`
                );
                break;
            case "OBJECT":
                schema = createDynamicSchema(field.children.reduce((acc, child) => ({ ...acc, [child.name]: child }), {}));
                break;
        }

        schemaFields[key] = field.required && field.type !== "OBJECT" ? schema : schema.optional();
    }

    return z.object(schemaFields);
};

export type ClientCreation = {
    name: string;
    contactDetails?: Partial<ContactDetails>;
    attributes: Record<string, any>;
};

interface Props {
    form?: UseFormReturn<ClientCreation>;
    client?: Client;
    templates: TemplateClientTemplateFieldStructure[];
    selectedTemplate?: TemplateClientTemplateFieldStructure;
    onTemplateChange: (template: TemplateClientTemplateFieldStructure) => void;
    handleSubmission: (data: ClientCreation) => Promise<void>;
    renderFooter: () => JSX.Element;
}



export const ClientForm: FC<Props> = ({
    form: externalForm,
    client,
    templates,
    selectedTemplate,
    onTemplateChange,
    handleSubmission,
    renderFooter,
}) => {
    const schema = selectedTemplate
        ? createDynamicSchema(selectedTemplate.structure)
        : z.object({
              name: z.string({ required_error: "Display Name is required" }).min(3, "Display Name is too short"),
          });

    const internalForm = useForm<ClientCreation>({
        resolver: zodResolver(schema),
        defaultValues: client
            ? {
                  name: client.name,
                  contactDetails: {
                      email: client.contactDetails?.email,
                      phone: client.contactDetails?.phone,
                      address: client.contactDetails?.address,
                  },
                  attributes: client.attributes,
              }
            : {
                  name: "",
                  attributes: selectedTemplate
                      ? Object.fromEntries(
                            Object.entries(selectedTemplate.structure).map(([key, field]) => [
                                key,
                                field.defaultValue || (field.type === "MULTISELECT" ? [] : field.type === "BOOLEAN" ? false : ""),
                            ])
                        )
                      : {},
              },
        mode: "onBlur",
    });

    const form = externalForm || internalForm;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmission)} className="space-y-6">
                <section>
                    <TextSeparator>
                        <span className="text-[1rem] leading-1 font-semibold">Client Details</span>
                    </TextSeparator>
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">Display Name *</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="John Doe" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    {selectedTemplate &&
                        Object.entries(selectedTemplate.structure).map(([key, field]) => (
                            <RenderField
                                key={key}
                                field={field}
                                form={form}
                                path={`attributes.${key}`}
                            />
                        ))}
                </section>
                <section>
                    <TextSeparator>
                        <span className="text-[1rem] leading-1 font-semibold">Contact Details</span>
                    </TextSeparator>
                    <FormField
                        control={form.control}
                        name="contactDetails.email"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">Email</FormLabel>
                                <FormControl>
                                    <Input {...field} type="email" placeholder="Email" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="contactDetails.phone"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">Phone</FormLabel>
                                <FormControl>
                                    <PhoneInput {...field} placeholder="0455 555 555" defaultCountry="AU" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </section>
                {renderFooter()}
            </form>
        </Form>
    );
};