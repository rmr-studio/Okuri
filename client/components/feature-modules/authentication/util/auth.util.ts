import {
    AuthClientHelper,
    AuthenticationCredentials,
    AuthResponse,
    RegistrationConfirmation,
    SocialProviders,
} from "@/components/feature-modules/authentication/interface/auth.interface";
import { AuthError, SupabaseClient, User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createSSRClient } from "../supabase/client";
import { undefinedIfNull } from "../utils";

/**
 * Determines if a route path that a user is trying to accesss is unprotected
 * to validate whether an unauthenticated user can access it.
 *
 * @param {string} pathname the path of the route being accessed by a user
 * @returns a boolean indicating if the route path is unprotected
 */
export const isRoutePathUnprotected = (pathname: string): boolean => {
    if (pathname === "/") return true;

    //todo: continuous integration of public routes during development

    const publicRoutes: string[] = [
        "/auth",
        "/api/auth/token/callback",
        "/docs",
        "/contact",
        "/about",
        "/pricing",
        "/features",
        "/resources",
    ];

    return publicRoutes.some((route) => pathname.startsWith(route));
};

export const handleUserSignout = async (): Promise<void> => {
    "use server";

    const client: SupabaseClient = await createSSRClient();
    const { error } = await client.auth.signOut();
    if (error) {
        if (process.env.NODE_ENV === "development") console.error(error);
        return;
    }
    redirect("/");
};

/**
 * Helper Sever Actions available to a server based component to assist with the process
 * of initial user authentication (ie. Login) and account creation
 */
export const supabaseServerAuthHelper = async (): Promise<AuthClientHelper> => {
    "use server";

    /**
     * Controls the login flow for a user using Email and Password credentials
     * @param {AuthenticationCredentials} credentials The credentials associated with the user (email, password)
     * @returns a boolean indicating if the user was successfully logged in (ie. No errors were generated)
     */
    const loginWithEmailPasswordCredentials = async (
        credentials: AuthenticationCredentials
    ): Promise<AuthResponse> => {
        "use server";

        // instantiate supabase client singleton
        const client: SupabaseClient = await createSSRClient();
        // Attempt user sign in with provided credentials
        const { email, password } = credentials;
        const { error } = await client.auth.signInWithPassword({
            email,
            password,
        });

        return {
            ok: error === null,
            error: undefinedIfNull(error),
        };
    };

    /**
     * Handles account Email Password account registration
     * @param {AuthenticationCredentials} credentials The credentials associated with the user (email, password)
     * @returns a boolean indicating if the user was successfully registered (ie. No errors were generated)
     */
    const registerWithEmailPasswordCredentials = async (
        credentials: AuthenticationCredentials
    ): Promise<AuthResponse> => {
        "use server";

        // instantiate supabase client singleton
        const client: SupabaseClient = await createSSRClient();
        // Attempt user registration with provided credentials
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

    /**
     * Handles Account registration confirmation with OTP and will sign in the user if successful
     * @param {RegistrationConfirmation} userDetails The details associated with the user (email, password, otp)
     * @returns a Response object indicating if the user was successfully signed in (ie. No errors were generated)
     */
    const confirmEmailSignupWithOTP = async (
        userDetails: RegistrationConfirmation
    ): Promise<AuthResponse> => {
        "use server";
        // instantiate supabase client singleton
        const client: SupabaseClient = await createSSRClient();
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
            error: undefinedIfNull(signInError),
        };
    };

    /**
     * Handles the PKCE flow for authenticating with a social provider
     * @param {SocialProviders} provider The social provider being used to authenticate a user
     */
    const authenticateWithSocialProvider = async (provider: SocialProviders): Promise<void> => {
        "use server";
        // instantiate supabase client singleton
        const client: SupabaseClient = await createSSRClient();
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
            redirect(data.url);
        }
    };

    /**
     * Resend the OTP code to the user's email address
     * @param {string} email The email address that the OTP code will be sent to
     */
    const handleResendOTP = async (email: string): Promise<AuthResponse> => {
        "use server";

        // instantiate supabase client singleton
        const client: SupabaseClient = await createSSRClient();

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

    return {
        loginWithEmailPasswordCredentials,
        registerWithEmailPasswordCredentials,
        authenticateWithSocialProvider,
        confirmEmailSignupWithOTP,
        handleResendOTP,
    };
};

/**
 * To disallow registration of emails that already have a linked account within
 * the system, we check if the object returned from Supabase has been obfuscated.
 * Supabase will return an obfuscated object (Empty user metadata) if the email is already linked to an account.
 * 
 * @param {User} user The user object returned from Supabase during registration
 * 
 * @returns a boolean indicating if the user object is obfuscated
 
 */
const isUserObfuscated = (user: User | null): boolean => {
    return !user || Object.keys(user.user_metadata).length === 0;
};
