import { OnboardWrapper } from "@/components/feature-modules/onboarding/context/onboard.wrapper";
import { BGPattern } from "@/components/ui/background/grids";
import { AppNavbar } from "@/components/ui/nav/app.navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/ui/sidebar/dashboard-sidebar";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { FC } from "react";

const layout: FC<ChildNodeProps> = ({ children }) => {
    return (
        <>
            <OnboardWrapper>
                <SidebarProvider>
                    <DashboardSidebar />
                    <SidebarInset className="bg-transparent">
                        <BGPattern variant="grid" mask="fade-edges" className="opacity-60" />
                        <header className="relative">
                            <AppNavbar />
                        </header>

                        {children}
                    </SidebarInset>
                </SidebarProvider>
            </OnboardWrapper>
        </>
    );
};

export default layout;
