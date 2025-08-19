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
import { Client } from "@/lib/interfaces/client.interface";
import { TemplateClientTemplateFieldStructure } from "@/lib/interfaces/template.interface";
import {
    buildDefaultAttributes,
    createDynamicClientSchema,
} from "@/lib/util/form/schema.client.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, JSX } from "react";
import { UseFormReturn, useForm } from "react-hook-form";
import { z } from "zod";
import { RenderClientField } from "./RenderClientField";

const clientCreationSchema = z.object({
    name: z.string(),
    contactDetails: z
        .object({
            email: z.string().email().optional(),
            phone: z.string().optional(),
            address: z.any().optional(),
        })
        .partial()
        .optional(),
    attributes: z.record(z.any()).default({}).optional(), // Required with default empty object
});

export type ClientCreation = z.infer<typeof clientCreationSchema>;

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
    const attributesSchema = selectedTemplate
        ? createDynamicClientSchema(selectedTemplate.structure)
        : z.record(z.any()).default({});

    const schema = z
        .object({
            name: z
                .string({ required_error: "Display Name is required" })
                .min(3, "Display Name is too short"),
            contactDetails: z
                .object({
                    email: z.string().email().optional(),
                    phone: z.string().optional(),
                    address: z.any().optional(),
                })
                .optional(),
            attributes: selectedTemplate
                ? createDynamicClientSchema(selectedTemplate.structure)
                : z.record(z.any()).default({}),
        })
        .strict();

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
                  attributes: client.attributes ?? {},
              }
            : {
                  name: "",
                  contactDetails: undefined,
                  attributes: selectedTemplate
                      ? buildDefaultAttributes(selectedTemplate.structure)
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
