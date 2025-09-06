"use client";

import { Button } from "@/components/ui/button";
import { CardContent, CardHeader } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    AuthenticationCredentials,
    AuthResponse,
    SocialProviders,
} from "@/lib/interfaces/auth.interface";
import { createClient } from "@/lib/util/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FC } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import ThirdParty from "./ThirdPartyAuth";

const loginSchema = z.object({
    email: z.string().email("Invalid Email").min(1, "Email is required"),
    password: z.string().min(1, "Password is required"),
});

type Login = z.infer<typeof loginSchema>;

const LoginForm: FC = () => {
    const router = useRouter();
    const client = createClient();

    const loginForm: UseFormReturn<Login> = useForm<Login>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const loginWithEmailPasswordCredentials = async (
        credentials: AuthenticationCredentials
    ): Promise<AuthResponse> => {
        const { email, password } = credentials;
        const { error } = await client.auth.signInWithPassword({
            email,
            password,
        });

        return {
            ok: error === null,
            error: error || undefined,
        };
    };

    const authenticateWithSocialProvider = async (
        provider: SocialProviders
    ): Promise<void> => {
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

    const handleLoginSubmission = async (values: Login) => {
        const response = () =>
            loginWithEmailPasswordCredentials(values).then((res) => {
                if (!res.ok) {
                    throw new Error(
                        res?.error?.message ??
                            "You have entered an invalid email or password"
                    );
                }
            });

        toast.promise(response, {
            loading: "Logging in...",
            success() {
                router.push("/dashboard");
                return "Logged in successfully";
            },
            error(err) {
                return err.message;
            },
        });
    };

    return (
        <>
            <CardHeader className="pb-0">
                <h1 className="font-semibold text-xl lg:text-2xl">
                    Welcome Back
                </h1>
                <h2 className=" text-neutral-500 dark:text-neutral-400">
                    Login into your account
                </h2>
            </CardHeader>
            <CardContent>
                <Form {...loginForm}>
                    <form
                        className="w-full md:w-[25rem]"
                        onSubmit={loginForm.handleSubmit(handleLoginSubmission)}
                    >
                        <FormField
                            control={loginForm.control}
                            name="email"
                            render={({ field }) => {
                                return (
                                    <FormItem>
                                        <FormLabel className="mt-4">
                                            Email
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                className="w-full my-2"
                                                {...field}
                                                placeholder="name@example.com"
                                            />
                                        </FormControl>
                                        <FormMessage className="font-semibold" />
                                    </FormItem>
                                );
                            }}
                        />
                        <FormField
                            control={loginForm.control}
                            name="password"
                            render={({ field }) => {
                                return (
                                    <FormItem className="mt-4">
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                className="w-full my-2"
                                                type="password"
                                                placeholder="••••••••••"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage className="font-semibold" />
                                    </FormItem>
                                );
                            }}
                        />

                        <Button
                            type="submit"
                            className="w-full font-semibold  mt-8"
                        >
                            Log In
                        </Button>
                    </form>
                </Form>
                <ThirdParty
                    socialProviderAuthentication={
                        authenticateWithSocialProvider
                    }
                    className="my-6"
                />
                <section className="my-4 text-sm mx-2 text-neutral-700 dark:text-neutral-400">
                    <span>Not with us already?</span>
                    <Link
                        href={"/auth/register"}
                        className="underline ml-2 text-neutral-800 dark:text-neutral-200 hover:text-neutral-600 dark:hover:text-neutral-400"
                    >
                        Sign Up
                    </Link>
                </section>
            </CardContent>
        </>
    );
};

export default LoginForm;
