import { AuthProvider } from "@/components/provider/auth-context";
import { ThemeProvider } from "@/components/provider/ThemeContext";
import QueryClientWrapper from "@/components/util/query.wrapper";
import StoreProviderWrapper from "@/components/util/store.wrapper";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";

import "gridstack/dist/gridstack.css";
import "./globals.css";

export const metadata: Metadata = {
    title: "Okuri | The Next-Gen Client & Invoice Management Platform",
    description:
        "Okuri is the next step in managing your invoices, clients and reports. Designed for all types of businesses, big, small or solo. Okuri is the perfect tool to help you manage your administration seamlessly.",
    openGraph: {
        locale: "en_AU",
        type: "website",
        url: "https://okuri.app",
        title: "Okuri | The Next-Gen Client & Invoice Management Platform",
        description:
            "Okuri is the next step in managing your invoices, clients and reports. Designed for all types of businesses, big, small or solo. Okuri is the perfect tool to help you manage your administration seamlessly.",
        siteName: "Okuri",
    },
};

const MontserratFont = Montserrat({
    subsets: ["latin"],
    weight: ["200", "400", "700"],
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
                                <main className="w-full relative">{children}</main>
                            </StoreProviderWrapper>
                        </QueryClientWrapper>
                    </AuthProvider>
                </ThemeProvider>
                <Toaster richColors />
            </body>
        </html>
    );
}
