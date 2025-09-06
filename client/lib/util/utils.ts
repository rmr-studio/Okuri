import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function undefinedIfNull<T>(value: T | null): T | undefined {
    return value === null ? undefined : value;
}

export const getInitials = (name: string): string => {
    if (!name.trim()) {
        return "";
    }

    // Split the name into parts, filtering out empty strings caused by extra spaces
    const nameParts = name.trim().split(/\s+/);

    // Extract the first letter of each part and limit to the first two
    const initials = nameParts.map((part) => part[0].toUpperCase()).slice(0, 2);

    // Join the initials into a single string
    return initials.join("");
};

export const toTitleCase = (value: string | null | undefined): string => {
    if (!value) return "";

    return value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
};

export const isUUID = (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
};

export const allNotNull = <T>(values: (T | null)[]): values is NonNullable<T>[] => {
    return values.every((value) => value !== null);
};

export const api = () => {
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url) {
        throw new Error("API URL not configured");
    }

    return url;
};

export const currency = () => {
    return new Set(
        Intl.supportedValuesOf
            ? Intl.supportedValuesOf("currency") // modern browsers
            : ["USD", "EUR", "JPY", "GBP", "AUD", "CAD", "CHF", "CNY", "SEK", "NZD"] // fallback
    );
};

export const isValidCurrency = (value: string): boolean => {
    if (!value) return false;
    const validCurrencies = currency();
    return validCurrencies.has(value.toUpperCase());
};
