import { ClientFieldType } from "@/lib/interfaces/client.interface";
import { z } from "zod";

export const MIN_DATE = new Date("1900-01-01");
export const getCurrentDate = () => new Date();

export interface Step<T> {
    identifier: T;
    step: number;
    title: string;
    description?: string;
}
export const OTPFormSchema = z.object({
    otp: z
        .string()
        .length(6, "OTP must be 6 characters long")
        .regex(/^\d+$/, "Must contain only digits"),
});

export type FormOTP = z.infer<typeof OTPFormSchema>;

export const isNumber = (value: unknown): value is number => {
    return typeof value === "number" && !isNaN(value);
};

export const isDate = (value: unknown): value is Date => {
    return value instanceof Date && !isNaN(value.getTime());
};

export const isValidDate = (date: Date): boolean => {
    return date >= MIN_DATE && date <= getCurrentDate();
};

export const isValidTypeRestriction = (
    type: ClientFieldType,
    restriction: string | undefined
): boolean => {
    if (!restriction) return false;
    const validRestrictions = TypeRestrictionMap[type] || [];
    return validRestrictions.includes(restriction as ClientFieldRestriction);
};

export type NumberFieldRestriction = "INTEGER" | "FLOAT" | "POSITIVE" | "NEGATIVE";
export type StringFieldRestriction = "EMAIL" | "PHONE" | "URL";
export type DateFieldRestriction = "PAST" | "FUTURE" | "TODAY";
export type ClientFieldRestriction =
    | NumberFieldRestriction
    | StringFieldRestriction
    | DateFieldRestriction;

export const TypeRestrictionMap: Record<ClientFieldType, ClientFieldRestriction[]> = {
    TEXT: ["EMAIL", "PHONE", "URL"],
    NUMBER: ["INTEGER", "FLOAT", "POSITIVE", "NEGATIVE"],
    DATE: ["PAST", "FUTURE", "TODAY"],
    BOOLEAN: [],
    SELECT: [],
    MULTISELECT: [],
    OBJECT: [],
};
