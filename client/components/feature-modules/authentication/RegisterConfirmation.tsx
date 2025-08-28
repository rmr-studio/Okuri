"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { FormOTPInput } from "@/components/ui/forms/form-otp-input";
import { Separator } from "@/components/ui/separator";
import {
    AuthResponse,
    RegistrationConfirmation,
} from "@/lib/interfaces/auth.interface";
import { FormOTP, OTPFormSchema } from "@/lib/util/form/form.util";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useState } from "react";
import { Control, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Registration } from "./Register";

interface RegisterConfirmationProps {
    confirmEmailSignupWithOTP: (
        userDetails: RegistrationConfirmation
    ) => Promise<AuthResponse>;
    handleResendOTP: (email: string) => Promise<AuthResponse>;
    visibilityCallback: (visible: boolean) => void;
    formControl: Control<Registration>;
}

const RegisterConfirmation: FC<RegisterConfirmationProps> = ({
    formControl,
    confirmEmailSignupWithOTP,
    handleResendOTP,
    visibilityCallback,
}) => {
    const [otpVerifyError, setOtpVerifyError] = useState<boolean>(false);
    const formDetails = useWatch({ control: formControl });
    const userDetailsForm = useForm<FormOTP>({
        resolver: zodResolver(OTPFormSchema),
        defaultValues: {
            otp: "",
        },
    });

    const router = useRouter();

    const handleCancel = (): void => {
        userDetailsForm.reset();
        visibilityCallback(false);
    };

    const handleTokenResend = async (): Promise<void> => {
        if (!formDetails.email) return;

        const resendToast = toast.loading("Resending OTP...");

        const response = await handleResendOTP(formDetails.email);
        toast.dismiss(resendToast);

        if (!response.ok || response.error) {
            toast.error(response.error?.message ?? "Failed to resend OTP");
            return;
        }

        toast.success("OTP Sent Successfully");
    };

    const handleSubmission = async (values: FormOTP): Promise<void> => {
        if (!formDetails.email || !formDetails.password) return;

        setOtpVerifyError(false);
        const credentialValidation: RegistrationConfirmation = {
            email: formDetails.email,
            password: formDetails.password,
            otp: values.otp,
        };

        const response = confirmEmailSignupWithOTP(credentialValidation).then(
            (res) => {
                if (!res.ok) {
                    throw new Error(
                        res?.error?.message ?? "Failed to verify OTP"
                    );
                }
                return res;
            }
        );

        toast.promise(response, {
            loading: "Verifying OTP...",
            success: () => {
                router.push("/dashboard");
                return "OTP Verified Successfully";
            },
            error: (error) => {
                setOtpVerifyError(true);
                return error.message;
            },
        });
    };

    return (
        <>
            <CardHeader className="pb-0">
                <h1 className="text-xl lg:text-2xl font-bold">
                    Welcome aboard!
                </h1>
                <h2 className="max-w-sm font-semibold text-neutral-500 dark:text-neutral-400">
                    Confirm your email to get your account started
                </h2>
            </CardHeader>
            <CardContent className="flex flex-col ">
                <Form {...userDetailsForm}>
                    <form
                        onSubmit={userDetailsForm.handleSubmit(
                            handleSubmission
                        )}
                    >
                        <FormField
                            control={userDetailsForm.control}
                            name="otp"
                            render={({ field }) => (
                                <FormItem className="mt-4">
                                    <div className="my-2 pb-2">
                                        <FormOTPInput
                                            className={
                                                otpVerifyError
                                                    ? "border-red-500"
                                                    : "border-secondary-foreground"
                                            }
                                            regex="numeric"
                                            field={field}
                                            size={6}
                                            groups={2}
                                        />
                                    </div>
                                    <FormMessage className="font-semibold" />
                                    <div className="text-neutral-500 dark:text-neutral-400 text-sm w-full">
                                        Please enter your 6 digit OTP sent to{" "}
                                        <span className="text-secondary-foreground font-semibold">
                                            {formDetails.email}
                                        </span>
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleTokenResend}
                                        variant={"link"}
                                        className="text-sm underline cursor-pointer hover:text-primary text-muted-foreground underline-offset-4 p-0"
                                    >
                                        Didn't Receive an Email?
                                    </Button>
                                </FormItem>
                            )}
                        />
                        <Separator className="my-4" />
                        <footer className="mt-4 flex justify-between">
                            <Button
                                type="button"
                                variant={"outline"}
                                onClick={handleCancel}
                            >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="font-semibold">Back</span>
                            </Button>
                            <Button type="submit" className="px-8">
                                Submit
                            </Button>
                        </footer>
                    </form>
                </Form>
            </CardContent>
        </>
    );
};

export default RegisterConfirmation;
