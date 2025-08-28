"use client";

import { Check, ChevronsUpDown, GalleryVerticalEnd, PlusCircle } from "lucide-react";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";
import { JSX } from "react";

interface Choice {
    id: string;
}

interface Props<T extends Choice> {
    title: String;
    render: (value: T) => JSX.Element;
    options: T[];
    selectedOption: T | null;
    handleOptionSelection: (value: T) => void;
    addNewLink?: string;
    addNewTitle?: string;
}

export const OptionSwitcher = <T extends Choice>({
    options,
    selectedOption,
    handleOptionSelection,
    render,
    title,
    addNewLink,
    addNewTitle = "Add New",
}: Props<T>) => {
    const router = useRouter();

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                <GalleryVerticalEnd className="size-4" />
                            </div>
                            {selectedOption && (
                                <div className="flex flex-col gap-0.5 leading-none text-xs">
                                    <span className="font-semibold">{title}</span>
                                    {render(selectedOption)}
                                </div>
                            )}
                            <ChevronsUpDown className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[15rem] mt-2" align="start">
                        {options.map((option) => (
                            <DropdownMenuItem
                                key={option.id}
                                className="text-xs"
                                onSelect={() => handleOptionSelection(option)}
                            >
                                {render(option)}
                                {option.id === selectedOption?.id && <Check className="ml-auto" />}
                            </DropdownMenuItem>
                        ))}
                        {addNewLink && (
                            <DropdownMenuItem
                                className="border-t rounded-none mt-1 pt-2"
                                onSelect={() => {
                                    router.push(addNewLink);
                                }}
                            >
                                <PlusCircle className="mr-1 size-4" />
                                <span className="text-content text-xs">{addNewTitle}</span>
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
};
