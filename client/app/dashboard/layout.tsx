import { AppNavbar } from "@/components/ui/nav/app.navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/ui/sidebar/dashboard-sidebar";
import { ChildNodeProps } from "@/lib/interfaces/interface";
import { FC } from "react";

const layout: FC<ChildNodeProps> = ({ children }) => {
    return (
        <SidebarProvider>
            <DashboardSidebar />
            <SidebarInset>
                <header className="relative">
                    <AppNavbar />
                </header>
                {children}
            </SidebarInset>
        </SidebarProvider>
    );
};

export default layout;
