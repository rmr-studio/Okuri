export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            [key: string]: string | undefined;
            NODE_ENV: "development" | "production" | "test";
            PORT?: string;
            NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: string;
            NEXT_PUBLIC_API_URL: string;
            NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
            NEXT_PUBLIC_SUPABASE_URL: string;
        }
    }
}
