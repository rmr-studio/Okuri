export const uniqueId = (prefix: string) =>
    `${prefix}-${
        typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).slice(2)
    }`;
