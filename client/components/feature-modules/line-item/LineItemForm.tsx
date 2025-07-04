import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FC, JSX } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";

export const LineItemFormSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .min(2, "Name is too short"),
    description: z.string().optional(),
    chargeRate: z
        .string({ required_error: "Charge rate is required" })
        .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
            message: "Charge rate must be a positive number",
        }),
});

export type LineItemFormType = z.infer<typeof LineItemFormSchema>;

interface Props {
    form: UseFormReturn<LineItemFormType>;
    handleSubmission: (data: LineItemFormType) => Promise<void>;
    renderFooter: () => JSX.Element;
}

const LineItemForm: FC<Props> = ({ form, handleSubmission, renderFooter }) => {
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmission)}>
                <section>
                    <div className="mb-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">
                                        Name *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Line Item Name"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="mb-6">
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="Description (optional)"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="mb-6">
                        <FormField
                            control={form.control}
                            name="chargeRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold">
                                        Charge Rate *
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder="0.00"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </section>
                {renderFooter()}
            </form>
        </Form>
    );
};

export default LineItemForm;
