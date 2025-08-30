import * as React from "react";
import { v4 as uuid } from "uuid";

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
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
            <SidebarContent className="gap-0">
                {/* We create a SidebarGroup for each parent. */}
                {body.map((item) => (
                    <SidebarGroup key={uuid()} className="my-0 not-last:border-b">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {item.items
                                    .filter((item) => !item.hidden)
                                    .map((item) => (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={item.isActive}
                                                className="text-muted-foreground"
                                            >
                                                <Link href={item.url} className="flex">
                                                    <item.icon className="size-3" />
                                                    <span className="text-[13px]">
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
