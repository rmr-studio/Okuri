"use client";

import {
    AuthenticationCredentials,
    AuthResponse,
    RegistrationConfirmation,
    SocialProviders,
} from "@/components/feature-modules/authentication/interface/auth.interface";
import { createClient } from "@/lib/util/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AuthError, User } from "@supabase/supabase-js";
import { FC, useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import RegisterConfirmation from "./RegisterConfirmation";
import RegisterCredentials from "./RegisterCredentials";

// Authentication Form Schemas
const registrationSchema = z
    .object({
        email: z.string().email("Invalid email address").nonempty("Email is required"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
            .regex(/[a-z]/, "Password must contain at least one lowercase letter")
            .regex(/\d/, "Password must contain at least one digit")
            .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
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

const RegisterForm: FC = () => {
    const registrationForm: UseFormReturn<Registration> = useForm<Registration>({
        resolver: zodResolver(registrationSchema),
        defaultValues: {
            email: "",
            password: "",
            confirmPassword: "",
        },
    });

    const [accountCreated, setAccountCreated] = useState<boolean>(false);
    const client = createClient();

    const registerWithEmailPasswordCredentials = async (
        credentials: AuthenticationCredentials
    ): Promise<AuthResponse> => {
        const { data, error } = await client.auth.signUp({
            ...credentials,
        });

        // Check for any initial server errors during registration
        if (error) {
            if (process.env.NODE_ENV === "development") console.error(error);
            return {
                ok: false,
                error,
            };
        }

        // Check if the user is obfuscated (ie. email has already been registered to another account)
        if (isUserObfuscated(data.user)) {
            return {
                ok: false,
                error: new AuthError("An account with this email already exists."),
            };
        }

        //Return a successful registration response
        return {
            ok: true,
        };
    };

    const confirmEmailSignupWithOTP = async (
        userDetails: RegistrationConfirmation
    ): Promise<AuthResponse> => {
        const { otp, email, password } = userDetails;
        // Attempt email confirmation with provided OTP
        const { error } = await client.auth.verifyOtp({
            email,
            token: otp,
            type: "signup",
        });

        if (error) {
            return {
                ok: false,
                error,
            };
        }

        // Attempt user sign in with provided credentials
        const { error: signInError } = await client.auth.signInWithPassword({
            email,
            password,
        });

        return {
            ok: signInError === null,
            error: signInError || undefined,
        };
    };

    const handleResendOTP = async (email: string): Promise<AuthResponse> => {
        const { error } = await client.auth.resend({
            type: "signup",
            email,
        });

        // Deal with any errors that may have occurred during the OTP resend process
        if (error) {
            if (process.env.NODE_ENV === "development") console.error(error);

            return {
                ok: false,
                error: error,
            };
        }

        // Return a successful registration response
        return {
            ok: true,
        };
    };

    const authenticateWithSocialProvider = async (provider: SocialProviders): Promise<void> => {
        const { data } = await client.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_HOSTED_URL}api/auth/token/callback`,
                queryParams: {
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        });

        if (data.url) {
            window.location.href = data.url;
        }
    };

    const handleSubmission = async (values: Registration) => {
        const { email, password } = values;

        // Call Supabase Signin Callback and reject if error
        const response = () =>
            registerWithEmailPasswordCredentials({ email, password }).then((res) => {
                if (!res.ok) {
                    throw new Error(res?.error?.message ?? "Failed to create account");
                }
            });

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
            confirmEmailSignupWithOTP={confirmEmailSignupWithOTP}
            handleResendOTP={handleResendOTP}
            visibilityCallback={setAccountCreated}
            formControl={registrationForm.control}
        />
    );
};

// Helper function to check if user is obfuscated
const isUserObfuscated = (user: User | null): boolean => {
    return !user || Object.keys(user.user_metadata).length === 0;
};

export default RegisterForm;
