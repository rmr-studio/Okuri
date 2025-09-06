import { AuthError } from "@supabase/supabase-js";
import { SupabaseClientResponse } from "./interface";

export type SocialProviders = "google" | "facebook" | "github" | "linkedin";

export interface AuthenticationCredentials {
    email: string;
    password: string;
}

export interface RegistrationConfirmation extends AuthenticationCredentials {
    otp: string;
}

export type AuthResponse = SupabaseClientResponse<AuthError>;

export interface MobileVerificationHelper {
    sendVerificationCode: (phone: string) => Promise<AuthResponse>;
    verifyMobile: (phone: string, otp: string) => Promise<AuthResponse>;
}
