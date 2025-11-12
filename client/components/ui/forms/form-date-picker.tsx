import { FormFieldProps } from "@/lib/interfaces/interface";
import { FC, ReactNode } from "react";
import { FormControl, FormItem, FormLabel, FormMessage } from "../form";
import { DateTimePicker } from "./date-picker/date-picker";
import { DateTimeInput } from "./date-picker/date-picker-input";

interface DatePickerProps {
    title?: string;
    maxDate?: Date;
    minDate?: Date;
    field: FormFieldProps<Date | undefined>;
    required?: boolean;
    displayErrorMessage?: boolean;
    exitOnClick?: boolean;
    errors?: ReactNode;
}

export const FormDatePicker: FC<DatePickerProps> = ({
    field,
    title,
    required,
    maxDate,
    minDate,
    displayErrorMessage = true,
    exitOnClick = false,
    errors,
}) => {
    return (
        <FormItem className="flex flex-col w-full">
            {title && (
                <FormLabel className="font-semibold">
                    {title} {required && "*"}
                </FormLabel>
            )}
            <FormControl>
                <DateTimePicker
                    value={field.value}
                    onChange={field.onChange}
                    modal={true}
                    hideTime
                    min={minDate}
                    max={maxDate}
                    exitOnClick={exitOnClick}
                    clearable
                    renderTrigger={({ open, value, setOpen }) => (
                        <DateTimeInput
                            value={value}
                            onChange={(x) => !open && field.onChange(x)}
                            format="dd/MM/yyyy"
                            disabled={open}
                            onCalendarClick={() => setOpen(!open)}
                        />
                    )}
                />
            </FormControl>
            {displayErrorMessage && (errors ?? <FormMessage className="font-semibold" />)}
        </FormItem>
    );
};
