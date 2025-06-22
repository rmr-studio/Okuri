import * as React from "react";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import Link from "next/link";

interface Props {
    body: Array<SidebarGroupProps>;
    header?: () => React.JSX.Element;
    closeable?: boolean;
}

export function AppSidebar({
    body,
    header,
    closeable = true,
    ...props
}: React.ComponentProps<typeof Sidebar> & Props) {
    return (
        <Sidebar {...props}>
            {header && <SidebarHeader>{header()}</SidebarHeader>}
            <SidebarContent>
                {/* We create a SidebarGroup for each parent. */}
                {body.map((item) => (
                    <SidebarGroup key={item.title}>
                        <SidebarGroupLabel>{item.title}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items
                                    .filter((item) => !item.hidden)
                                    .map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                className="ml-1"
                                                isActive={item.isActive}
                                            >
                                                <Link href={item.url} className="flex">
                                                    <item.icon className="size-4" />
                                                    <span className="ml-2 text-content">
                                                        {item.title}
                                                    </span>
                                                </Link>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                ))}
            </SidebarContent>
            {closeable && <SidebarRail />}
        </Sidebar>
    );
}
