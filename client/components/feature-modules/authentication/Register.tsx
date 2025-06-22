"use client";

import { AuthenticationProps } from "@/lib/interfaces/auth.interface";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import RegisterConfirmation from "./RegisterConfirmation";
import RegisterCredentials from "./RegisterCredentials";
// Authentication Form Schemas

const registrationSchema = z
    .object({
        email: z
            .string()
            .email("Invalid email address")
            .nonempty("Email is required"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .regex(
                /[A-Z]/,
                "Password must contain at least one uppercase letter"
            )
            .regex(
                /[a-z]/,
                "Password must contain at least one lowercase letter"
            )
            .regex(/\d/, "Password must contain at least one digit")
            .regex(
                /[!@#$%^&*(),.?":{}|<>]/,
                "Password must contain at least one special character"
            )
            .nonempty("Password is required"),
        confirmPassword: z.string().min(1, "Password confirmation is required"),
    })
    .superRefine(({ password, confirmPassword }, ctx) => {
        if (confirmPassword !== password) {
            ctx.addIssue({
                code: "custom",
                message: "The passwords did not match",
                path: ["confirmPassword"],
            });
        }
    });

export type Registration = z.infer<typeof registrationSchema>;

const RegisterForm: FC<AuthenticationProps> = ({ callbacks }) => {
    const registrationForm: UseFormReturn<Registration> = useForm<Registration>(
        {
            resolver: zodResolver(registrationSchema),
            defaultValues: {
                email: "",
                password: "",
                confirmPassword: "",
            },
        }
    );

    const [accountCreated, setAccountCreated] = useState<boolean>(false);
    const {
        registerWithEmailPasswordCredentials,
        authenticateWithSocialProvider,
    } = callbacks;
    const handleSubmission = async (values: Registration) => {
        const { email, password } = values;

        // Call Supabase Signin Callback and reject if error
        const response = () =>
            registerWithEmailPasswordCredentials({ email, password }).then(
                (res) => {
                    if (!res.ok) {
                        throw new Error(
                            res?.error?.message ?? "Failed to create account"
                        );
                    }
                }
            );

        toast.promise(response, {
            loading: "Creating Account...",
            success: () => {
                setAccountCreated(true);
                return "Account Created Successfully";
            },
            error: (error) => {
                return error.message;
            },
        });
    };

    return !accountCreated ? (
        <RegisterCredentials
            socialProviderAuthentication={authenticateWithSocialProvider}
            registrationForm={registrationForm}
            handleSubmission={handleSubmission}
        />
    ) : (
        <RegisterConfirmation
            callbacks={callbacks}
            visibilityCallback={setAccountCreated}
            formControl={registrationForm.control}
        />
    );
};

export default RegisterForm;
