import { AuthProvider } from "@/components/provider/auth-context";
import { ThemeProvider } from "@/components/provider/ThemeContext";
import QueryClientWrapper from "@/components/util/query.wrapper";
import StoreProviderWrapper from "@/components/util/store.wrapper";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";

import "./globals.css";

export const metadata: Metadata = {
    title: "Okuri | The client and invoice management platform for Independent carers",
    description:
        "Okuri is a client and invoice management platform designed for independent carers, helping you manage your clients, invoices, and payments seamlessly.",
    openGraph: {
        locale: "en_AU",
        type: "website",
        url: "https://Okuri.app",
        title: "Okuri | The client and invoice management platform for Independent carers",
        description:
            "Okuri is a client and invoice management platform designed for independent carers, helping you manage your clients, invoices, and payments seamlessly.",
        siteName: "Okuri",
    },
};

const MontserratFont = Montserrat({
    subsets: ["latin"],
    weight: ["100", "400", "700"],
});

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={MontserratFont.className} suppressHydrationWarning>
            <body>
                <ThemeProvider
                    attribute={"class"}
                    defaultTheme="theme"
                    enableSystem
                    disableTransitionOnChange
                >
                    <AuthProvider>
                        <QueryClientWrapper>
                            <StoreProviderWrapper>
                                <main className="w-full">{children}</main>
                            </StoreProviderWrapper>
                        </QueryClientWrapper>
                    </AuthProvider>
                </ThemeProvider>
                <Toaster richColors />
            </body>
        </html>
    );
}
