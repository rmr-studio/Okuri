import { AppNavbar } from "@/components/ui/nav/app.navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/ui/sidebar/dashboard-sidebar";
import { OnboardWrapper } from "@/components/util/onboard.wrapper";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { FC } from "react";

const layout: FC<ChildNodeProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <OnboardWrapper>
                <DashboardSidebar />
                <SidebarInset>
                    <header className="relative">
                        <AppNavbar />
                        {children}
                    </header>
                </SidebarInset>
            </OnboardWrapper>
        </SidebarProvider>
    );
};

export default layout;
