import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TextSeparator } from "@/components/ui/text-separator";
import { FC } from "react";
import { Control } from "react-hook-form";
import { UserOnboard } from "../OnboardForm";

interface Props {
    control: Control<UserOnboard>;
}

const OnboardCompanyForm: FC<Props> = ({ control }) => {
    return (
        <>
            <section className="my-4">
                <TextSeparator>
                    <span className="text-[1rem] leading-1 font-semibold">Your Business</span>
                </TextSeparator>
                <FormField
                    control={control}
                    name="companyName"
                    render={({ field }) => (
                        <FormItem className="mt-6">
                            <FormLabel className="font-semibold">Business Name *</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="Business LTD" />
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="flex flex-col md:flex-row md:space-x-2">
                    <FormField
                        control={control}
                        name="businessNumber"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full lg:w-1/2">
                                <FormLabel className="font-semibold">Business Number</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="123 456 678 90" />
                                </FormControl>
                            </FormItem>
                        )}
                    />
                </div>
            </section>
            <section className="my-4">
                <TextSeparator>
                    <span className="text-[1rem] leading-1 font-semibold">Your Charge Rate</span>
                </TextSeparator>
                <div className="flex flex-col sm:flex-row space-x-4">
                    <FormField
                        control={control}
                        name="publicHolidayMultiplier"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">
                                    Public Holiday Mutliplier
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="1.0" type="number" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="saturdayMultiplier"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">
                                    Saturday Rate Multiplier
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="1.0" type="number" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={control}
                        name="sundayMultiplier"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full">
                                <FormLabel className="font-semibold">
                                    Saturday Rate Multiplier
                                </FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="1.0" type="number" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </section>
            <section className="my-4">
                <TextSeparator>
                    <span className="text-[1rem] leading-1 font-semibold">
                        Your Payment Details
                    </span>
                </TextSeparator>
                <div className="flex flex-col sm:flex-row space-x-4">
                    <FormField
                        control={control}
                        name="bsb"
                        render={({ field }) => (
                            <FormItem className="mt-6 w-full ">
                                <FormLabel className="font-semibold">BSB</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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
                                <FormLabel className="font-semibold">Account Number</FormLabel>
                                <FormControl>
                                    <Input {...field} />
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
                            <FormLabel className="font-semibold">Account Name</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="John Doe" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </section>
        </>
    );
};

export default OnboardCompanyForm;
