"use client";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import { Boxes, Building2, CalendarHeart, CogIcon, TrendingUpDown, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./root-sidebar";

export const DashboardSidebar = () => {
    const pathName = usePathname();

    // This is sample data.
    const sidebarContent: SidebarGroupProps[] = [
        {
            title: "Invoices",

            items: [
                {
                    icon: Building2,
                    hidden: false,
                    title: "New Invoice",
                    url: `/dashboard/invoices/new`,
                    isActive: pathName === `/dashboard/invoices/new`,
                },
                {
                    icon: Users,
                    hidden: false,
                    title: "Generated",
                    url: `/dashboard/invoices/`,
                    isActive: pathName.startsWith(`/dashboard/invoices/`),
                },
                {
                    icon: Users,
                    hidden: false,
                    title: "In Progress",
                    url: `/dashboard/invoices/in-progress`,
                    isActive: pathName.startsWith(`/dashboard/invoices/in-progress`),
                },
            ],
        },
        {
            title: "Clients",
            items: [
                {
                    icon: Boxes,
                    hidden: false,
                    title: "Overview",
                    url: `/dashboard/clients`,
                    isActive: pathName.startsWith(`/dashboard/clients`),
                },
            ],
        },

        {
            title: "Billing",
            items: [
                {
                    icon: CalendarHeart,
                    hidden: false,
                    title: "Subscription",
                    url: `/dashboard/subscriptions`,
                    isActive: pathName.startsWith(`/dashboard/subscriptions`),
                },
                {
                    icon: TrendingUpDown,
                    hidden: false,
                    title: "Usage",
                    url: `/dashboard/usage`,
                    isActive: pathName.startsWith(`/dashboard/usage`),
                },
            ],
        },
        {
            title: "Account Settings",
            items: [
                {
                    icon: CogIcon,
                    hidden: false,
                    title: "Settings",
                    url: `/dashboard/settings`,
                    isActive: pathName.startsWith(`/dashboard/settings`),
                },
            ],
        },
    ];

    return <AppSidebar body={sidebarContent} />;
};
