import { FC } from "react";
import { Control } from "react-hook-form";
import { z } from "zod";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../form";
import { Input } from "../../input";
import { TextSeparator } from "../../text-separator";

export const PaymentDetailsFormSchema = z.object({
    bsb: z
        .string()
        .regex(/^\d{3}-\d{3}$/, "BSB must be in format XXX-XXX")
        .optional(),

    accountNumber: z
        .string()
        .min(1, "Account number must not be empty")
        .regex(/^\d+$/, "Account number must contain only digits") // example rule
        .optional(),

    accountName: z
        .string()
        .regex(/^[A-Za-z\s]+$/, "Account name must only contain letters")
        .optional(),
});

export type PaymentDetailsForm = z.infer<typeof PaymentDetailsFormSchema>;

interface Props {
    control: Control<PaymentDetailsForm>;
}

export const PaymentDetailsForm: FC<Props> = ({ control }) => {
    return (
        <section>
            <section className="my-4 flex flex-col">
                <TextSeparator>
                    <span className="text-[1rem] leading-1 font-semibold">Payment Details</span>
                </TextSeparator>
                <div className="flex flex-col lg:flex-row md:space-x-4">
                    <FormField
                        control={control}
                        name="bsb"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">BSB *</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="000-000"
                                        {...field}
                                        onChange={(e) => {
                                            // Format BSB as XXX-XXX
                                            const value = e.target.value.replace(/[^0-9]/g, "");
                                            if (value.length <= 6) {
                                                const formatted = value.replace(
                                                    /(\d{3})(\d{0,3})/,
                                                    "$1-$2"
                                                );
                                                field.onChange(formatted);
                                            }
                                        }}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="accountNumber"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">Account Number *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Account Number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={control}
                    name="accountName"
                    render={({ field }) => (
                        <FormItem className="mt-6 w-full">
                            <FormLabel className="font-semibold">Account Name *</FormLabel>
                            <FormControl>
                                <Input placeholder="Account Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </section>
        </section>
    );
};
