"use client";
import { useProfile } from "@/hooks/useProfile";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import {
    Building2,
    CalendarHeart,
    CogIcon,
    FileText,
    LayoutTemplate,
    TrendingUpDown,
    UserPlus,
    Users,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "./root-sidebar";

export const DashboardSidebar = () => {
    const pathName = usePathname();
    const { data: user } = useProfile();

    // This is sample data.
    const sidebarContent: SidebarGroupProps[] = [
        {
            title: "Invoices",

            items: [
                {
                    icon: Building2,
                    hidden: false,
                    title: "New Invoice",
                    url: `/dashboard/invoice/new`,
                    isActive: pathName === `/dashboard/invoice/new`,
                },
                {
                    icon: Users,
                    hidden: false,
                    title: "Generated",
                    url: `/dashboard/invoice/`,
                    isActive: pathName === `/dashboard/invoice/`,
                },
            ],
        },
        {
            title: "Clients",
            items: [
                {
                    icon: UserPlus,
                    hidden: false,
                    title: "New Client",
                    url: "/dashboard/clients/new",
                    isActive: pathName.startsWith(`/dashboard/clients/new`),
                },
                {
                    icon: Users,
                    hidden: false,
                    title: "All Clients",
                    url: `/dashboard/clients`,
                    isActive: pathName === `/dashboard/clients`,
                },
            ],
        },
        {
            title: "Line Items",
            items: [
                {
                    icon: UserPlus,
                    hidden: false,
                    title: "New Line Item",
                    url: "/dashboard/item/new",
                    isActive: pathName.startsWith(`/dashboard/item/new`),
                },
                {
                    icon: Users,
                    hidden: false,
                    title: "All Line Items",
                    url: `/dashboard/item`,
                    isActive: pathName === `/dashboard/item`,
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
        {
            title: "Templates",
            items: [
                {
                    icon: LayoutTemplate,
                    hidden: false,
                    title: "Manage Templates",
                    url: "/dashboard/templates",
                    isActive: pathName.startsWith("/dashboard/templates"),
                },
                {
                    icon: FileText,
                    hidden: false,
                    title: "Select Template",
                    url: "/dashboard/templates/select",
                    isActive: pathName.startsWith(
                        "/dashboard/templates/select"
                    ),
                },
            ],
        },
    ];

    return <AppSidebar body={sidebarContent} />;
};
