"use client";

import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Propless } from "@/lib/interfaces/interface";
import { FC } from "react";
import { OnboardForm } from "./OnboardForm";

export const Onboard: FC<Propless> = () => {
    return (
        <Sheet open={true} modal={true}>
            <SheetContent
                hideClose={true}
                side={"left"}
                className="w-full lg:w-2/3 xl:w-1/2 sm:max-w-none lg:max-w-none overflow-y-auto flex flex-col p-8 md:px-16 md:py-20"
            >
                <OnboardForm />
            </SheetContent>
        </Sheet>
    );
};
