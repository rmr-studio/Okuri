import { AppNavbar } from "@/components/ui/nav/app.navbar";
import { Sheet } from "@/components/ui/sheet";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/ui/sidebar/dashboard-sidebar";
import { OnboardPrompt } from "@/components/util/onboard.wrapper";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { FC } from "react";

const layout: FC<ChildNodeProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
                <Sheet>
                    <header className="relative">
                        <AppNavbar />
                    </header>
                    <OnboardPrompt />
                    {children}
                </Sheet>
            </SidebarInset>
        </SidebarProvider>
    );
};

export default layout;
