import { clsx, type ClassValue } from "clsx";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const uniqueId = (prefix: string) =>
    `${prefix}-${
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
    }`;


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

export const now = (): string => {
    return dayjs().toISOString();
};

export const hexToRgb = (hex: string): string => {
    const cleaned = hex.trim().replace(/^#/, "");
    const is3 = /^[0-9a-fA-F]{3}$/.test(cleaned);
    const is6 = /^[0-9a-fA-F]{6}$/.test(cleaned);
    if (!is3 && !is6) return "0, 0, 0";
    const value = is3
        ? cleaned
              .split("")
              .map((c) => c + c)
              .join("")
        : cleaned;
    const bigint = parseInt(value, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
};

/**
 * Safely retrieves a value from a nested object using a dot-separated path or array of keys.
 * Returns defaultValue if any intermediate value is null/undefined or if the final value is undefined.
 * @param obj - The object to traverse
 * @param path - Dot-separated string (e.g., "user.address.city") or array of keys
 * @param defaultValue - Value to return if path cannot be resolved
 * @returns The value at the path, or defaultValue
 */
export function get(obj: any, path: string | Array<string | number>, defaultValue?: any) {
    const segments = Array.isArray(path) ? path : path.split(".");
    let current = obj;

    for (const segment of segments) {
        if (current == null) return defaultValue;
        current = current[segment];
    }

    return current === undefined ? defaultValue : current;
}

/**
 * Sets a value at the specified path in an object, creating intermediate objects/arrays as needed.
 * WARNING: This function mutates the input object.
 * @param obj - The object to mutate
 * @param path - Dot-separated string or array of keys
 * @param value - Value to set at the path
 * @returns The mutated object (for chaining)
 */
export function set(obj: any, path: string | Array<string | number>, value: any) {
    const segments = Array.isArray(path) ? path : path.split(".");
    let current = obj;

    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const isLast = i === segments.length - 1;

        if (isLast) {
            current[segment] = value;
        } else {
            if (
                !(segment in current) ||
                typeof current[segment] !== "object" ||
                current[segment] == null
            ) {
                // Create array if next segment is a numeric index, otherwise create object
                const nextSegment = segments[i + 1];
                const next =
                    typeof nextSegment === "number" || /^\d+$/.test(String(nextSegment)) ? [] : {};
                current[segment] = next;
            }
            current = current[segment];
        }
    }

    return obj;
}
