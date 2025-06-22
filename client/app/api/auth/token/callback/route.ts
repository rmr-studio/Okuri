import { NextResponse } from "next/server";
// The client you created from the Server-Side Auth instructions
import { createSSRClient } from "@/lib/util/supabase/client";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get("next") ?? "/";
    // Validate next parameter to prevent open redirects
    const isValidNext = next.startsWith("/") && !next.startsWith("//");
    const safeNext = isValidNext ? next : "/";

    if (code) {
        // Instatiate the Supabase client to perform code exchange and await a successful status
        try {
            const supabase = await createSSRClient();
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
                console.error("Token exchange failed:", error.message);
                return NextResponse.redirect(
                    `${origin}/auth/auth-code-error?error=${encodeURIComponent(
                        error.message
                    )}`
                );
            }
        } catch (err) {
            console.error("Supabase client creation failed:", err);
            return NextResponse.redirect(`${origin}/auth/auth-code-error`);
        }

        const forwardedHost = request.headers.get("x-forwarded-host");
        const isValidHost =
            forwardedHost && /^[a-zA-Z0-9.-]+$/.test(forwardedHost);

        const isLocalEnv = process.env.NODE_ENV === "development";
        if (isLocalEnv) {
            // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
            return NextResponse.redirect(`${origin}${safeNext}`);
        } else if (isValidHost) {
            return NextResponse.redirect(`https://${forwardedHost}${safeNext}`);
        } else {
            return NextResponse.redirect(`${origin}${safeNext}`);
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
