import { AuthError } from "@supabase/supabase-js";
import { SupabaseClientResponse } from "./interface";

export interface AuthenticationProps {
    callbacks: AuthClientHelper;
}

export type SocialProviders = "google" | "facebook" | "github" | "linkedin";

export interface AuthenticationCredentials {
    email: string;
    password: string;
}

export interface RegistrationConfirmation extends AuthenticationCredentials {
    otp: string;
}

export type AuthResponse = SupabaseClientResponse<AuthError>;

export interface AuthClientHelper {
    loginWithEmailPasswordCredentials: (
        credentials: AuthenticationCredentials
    ) => Promise<AuthResponse>;
    registerWithEmailPasswordCredentials: (
        credentials: AuthenticationCredentials
    ) => Promise<AuthResponse>;
    confirmEmailSignupWithOTP: (
        userDetails: RegistrationConfirmation
    ) => Promise<AuthResponse>;
    authenticateWithSocialProvider: (
        provider: SocialProviders
    ) => Promise<void>;
    handleResendOTP: (email: string) => Promise<AuthResponse>;
}

export interface MobileVerificationHelper {
    sendVerificationCode: (phone: string) => Promise<AuthResponse>;
    verifyMobile: (phone: string, otp: string) => Promise<AuthResponse>;
}
