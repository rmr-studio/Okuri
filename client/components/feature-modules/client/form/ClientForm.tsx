"use client";

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
import { Client, ContactDetails } from "@/lib/interfaces/client.interface";
import {
    ClientTemplateFieldStructure,
    TemplateClientTemplateFieldStructure,
} from "@/lib/interfaces/template.interface";
import { isNumber, isValidTypeRestriction } from "@/lib/util/form/form.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, JSX } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import { isDate } from "validator";
import { z } from "zod";
import { RenderClientField } from "./RenderClientField";

const createDynamicSchema = (
    structure: Record<string, ClientTemplateFieldStructure>
): z.ZodTypeAny => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    for (const [key, field] of Object.entries(structure)) {
        let schema: z.ZodTypeAny;

        switch (field.type) {
            case "TEXT": {
                let strSchema = z.string({ required_error: `${field.name} is required` });
                field.constraints.forEach((constraint) => {
                    const { type, value } = constraint;
                    if (type == "MIN_LENGTH" && isNumber(value))
                        strSchema = strSchema.min(value, `${field.name} is too short`);

                    if (type == "MAX_LENGTH" && isNumber(value))
                        strSchema = strSchema.max(value, `${field.name} is too long`);
                    if (type === "PATTERN" && value)
                        strSchema = strSchema.regex(new RegExp(value), `${field.name} is invalid`);
                });
                schema = strSchema;
                break;
            }
            case "NUMBER": {
                let numSchema = z.coerce.number({ required_error: `${field.name} is required` });
                field.constraints.forEach((constraint) => {
                    const { type, value } = constraint;
                    if (type === "MIN_LENGTH" && isNumber(value))
                        numSchema = numSchema.min(value, `${field.name} is too small`);
                    if (type === "MAX_LENGTH" && isNumber(value))
                        numSchema = numSchema.max(value, `${field.name} is too large`);
                    if (type === "TYPE" && isValidTypeRestriction(field.type, value)) {
                        if (value === "INTEGER") {
                            numSchema = numSchema
                                .int()
                                .refine(
                                    (val) => Number.isInteger(val),
                                    `${field.name} must be an integer`
                                );
                        } else if (value === "FLOAT") {
                            numSchema = numSchema.refine(
                                (val) => !Number.isInteger(val),
                                `${field.name} must be a float`
                            );
                        } else if (value === "POSITIVE") {
                            numSchema = numSchema.positive(`${field.name} must be positive`);
                        } else if (value === "NEGATIVE") {
                            numSchema = numSchema.negative(`${field.name} must be negative`);
                        }
                    }
                });
                schema = numSchema;
                break;
            }
            case "DATE": {
                schema = z
                    .string({ required_error: `${field.name} is required` })
                    .refine(isDate, `${field.name} is invalid`);
                break;
            }
            case "BOOLEAN": {
                schema = z.boolean({ required_error: `${field.name} is required` });
                break;
            }
            case "SELECT": {
                schema = z
                    .string({ required_error: `${field.name} is required` })
                    .refine(
                        (val) => field.options.includes(val),
                        `${field.name} must be one of: ${field.options.join(", ")}`
                    );
                break;
            }
            case "MULTISELECT": {
                schema = z
                    .array(z.string())
                    .refine(
                        (vals) => vals.every((val) => field.options.includes(val)),
                        `${field.name} contains invalid options`
                    );
                break;
            }
            case "OBJECT": {
                schema = createDynamicSchema(
                    field.children.reduce((acc, child) => ({ ...acc, [child.name]: child }), {})
                );
                break;
            }
            default: {
                schema = z.any(); // fallback
            }
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
              name: z
                  .string({ required_error: "Display Name is required" })
                  .min(3, "Display Name is too short"),
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
                                field.defaultValue ||
                                    (field.type === "MULTISELECT"
                                        ? []
                                        : field.type === "BOOLEAN"
                                        ? false
                                        : ""),
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
                            <RenderClientField
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
                </section>
                {renderFooter()}
            </form>
        </Form>
    );
};
