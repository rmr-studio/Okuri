import { cn } from "@/lib/util/utils";
import { AnimatePresence } from "framer-motion";
import { CheckIcon, Circle } from "lucide-react";
import { FC } from "react";
import { Control, useWatch } from "react-hook-form";
import { Registration } from "./Register";

interface Props {
    control: Control<Registration>;
    visible: boolean;
}

export const PasswordRequirements: FC<Props> = ({ control, visible }) => {
    const passwordRequirementsValues = [
        "length",
        "uppercase",
        "lowercase",
        "number",
        "specialCharacter",
    ] as const;

    const password = useWatch({ control, name: "password" });

    type PasswordRequirements = (typeof passwordRequirementsValues)[number];
    const passwordValidationRequirements: Record<PasswordRequirements, RegExp> =
        {
            length: /.{8,}/,
            uppercase: /[A-Z]/,
            lowercase: /[a-z]/,
            number: /\d/,
            specialCharacter: /[!@#$%^&*(),.?":{}|<>]/,
        };

    const passwordValidationTitles: Record<PasswordRequirements, string> = {
        length: "8 Characters or more",
        uppercase: "Uppercase Letter",
        lowercase: "Lowercase Letter",
        number: "Number",
        specialCharacter: "Special Character (e.g. !?<>@#$%)",
    };

    return (
        <AnimatePresence>
            {visible && (
                <section className="mt-4 text-muted-foreground ">
                    {passwordRequirementsValues.map((validation) => (
                        <div
                            className="p-1 flex items-center"
                            key={`password-requirement-${validation}`}
                        >
                            <CheckMarkBox
                                validated={passwordValidationRequirements[
                                    validation
                                ].test(password || "")}
                            />

                            <p className="ml-2 text-sm font-semibold">
                                {passwordValidationTitles[validation]}
                            </p>
                        </div>
                    ))}
                </section>
            )}
        </AnimatePresence>
    );
};

interface CheckBoxProps {
    validated: boolean;
}

const CheckMarkBox: FC<CheckBoxProps> = ({ validated }) => {
    return (
        <div className="relative w-fit h-fit">
            <Circle className="w-[1.125rem] h-[1.125rem]" />
            <CheckIcon
                className={cn(
                    "w-[0.625rem] h-[0.625rem] stroke-2 top-1/2 left-1/2 -translate-y-[50%] -translate-x-[50%] absolute",
                    validated ? "stroke-foreground" : "stroke-background"
                )}
            />
        </div>
    );
};
