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
import { SocialProviders } from "@/lib/interfaces/auth.interface";
import Link from "next/link";
import { FC, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { PasswordRequirements } from "./PasswordRequirements";
import { Registration } from "./Register";
import ThirdParty from "./ThirdPartyAuth";

interface CredentialRegistrationProps {
    registrationForm: UseFormReturn<Registration>;
    handleSubmission: (values: Registration) => void;
    socialProviderAuthentication: (provider: SocialProviders) => Promise<void>;
}

const RegisterCredentials: FC<CredentialRegistrationProps> = ({
    registrationForm,
    handleSubmission,
    socialProviderAuthentication,
}) => {
    const [passwordRequirementsVisible, setPasswordRequirementsVisible] =
        useState<boolean>(false);

    return (
        <>
            <CardHeader className="pb-0">
                <h1 className="text-xl lg:text-2xl font-semibold">
                    Let{"'"}s Get Started
                </h1>
                <h2 className="text-neutral-500 dark:text-neutral-400">
                    Create a new account
                </h2>
            </CardHeader>
            <CardContent>
                <Form {...registrationForm}>
                    <form
                        className=" md:w-[25rem]"
                        onSubmit={registrationForm.handleSubmit(
                            handleSubmission
                        )}
                    >
                        <FormField
                            control={registrationForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="mt-4">
                                        Email
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            className="w-full my-2  "
                                            {...field}
                                            placeholder="name@example.com"
                                        />
                                    </FormControl>
                                    <FormMessage className="font-semibold" />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={registrationForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem className="mt-4">
                                    <FormLabel>Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            onFocus={() =>
                                                setPasswordRequirementsVisible(
                                                    true
                                                )
                                            }
                                            className="w-full my-2"
                                            type="password"
                                            {...field}
                                            placeholder="••••••••••"
                                        />
                                    </FormControl>
                                    <FormMessage className="font-semibold" />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={registrationForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem className="mt-4">
                                    <FormLabel>Confirm Password</FormLabel>
                                    <FormControl>
                                        <Input
                                            className="w-full my-2"
                                            type="password"
                                            {...field}
                                            placeholder="••••••••••"
                                        />
                                    </FormControl>
                                    <FormMessage className="font-semibold" />
                                </FormItem>
                            )}
                        />
                        <PasswordRequirements
                            control={registrationForm.control}
                            visible={passwordRequirementsVisible}
                        />
                        <Button
                            type="submit"
                            className="w-full font-semibold  mt-8"
                        >
                            Sign Up
                        </Button>
                    </form>
                </Form>

                <ThirdParty
                    socialProviderAuthentication={socialProviderAuthentication}
                    className="my-6"
                />
                <section className="my-4 text-sm mx-2 text-neutral-700 dark:text-neutral-400">
                    <span>Already have an account?</span>
                    <Link
                        href={"/auth/login"}
                        className="underline ml-2 text-neutral-800 dark:text-neutral-200 hover:text-neutral-600 dark:hover:text-neutral-400"
                    >
                        Sign In
                    </Link>
                </section>
            </CardContent>
        </>
    );
};

export default RegisterCredentials;
