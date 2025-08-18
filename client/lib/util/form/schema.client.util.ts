import { ClientTemplateFieldStructure } from "@/lib/interfaces/template.interface";
import { isDate } from "validator";
import { z } from "zod";

const isNum = (s?: string) => s != null && !Number.isNaN(Number(s));
const toNum = (s: string) => Number(s);

// Pull a TYPE constraint value if present (e.g., "email" | "phone" | "integer" | "decimal" | "positive" | "negative" | "country")
export const getTypeConstraint = (field: ClientTemplateFieldStructure): string | undefined => {
    const c = field.constraints?.find((c) => c.type === "TYPE");
    return c?.value?.toUpperCase();
};

export const coerceDefaultForField = (field: ClientTemplateFieldStructure) => {
    const v = field.defaultValue;

    switch (field.type) {
        case "TEXT":
            return typeof v === "string" ? v : "";
        case "NUMBER":
            return typeof v === "number" ? v : ""; // keep empty string; z.coerce.number will handle
        case "DATE":
            return typeof v === "string" ? v : "";
        case "BOOLEAN":
            return typeof v === "boolean" ? v : false;
        case "SELECT":
            return typeof v === "string" ? v : "";
        case "MULTISELECT":
            return Array.isArray(v) ? v : [];
        case "OBJECT":
            return typeof v === "object" && v !== null ? v : {};
        default:
            return v ?? "";
    }
};

/**
 *
 * @param structure The structure of the client template fields, where each key is the field name and the value is the field structure.
 * @returns
 */

export const createDynamicClientSchema = (
    structure: Record<string, ClientTemplateFieldStructure>
): z.ZodTypeAny => {
    const fields: Record<string, z.ZodTypeAny> = {};

    for (const [key, field] of Object.entries(structure)) {
        let schema: z.ZodTypeAny;

        switch (field.type) {
            case "TEXT": {
                let s = z.string({ required_error: `${field.name} is required` });

                // Apply TYPE first (can add email/phone/country etc.)
                const t = getTypeConstraint(field);
                if (t === "EMAIL") {
                    s = s.email(`${field.name} must be a valid email`);
                } else if (t === "PHONE") {
                    // keep simple; you can plug libphonenumber if needed
                    s = s.regex(/^[+()\- 0-9]{6,}$/, `${field.name} must be a valid phone`);
                } else if (t === "COUNTRY") {
                    // if you store country codes, enforce simple alpha-2/alpha-3
                    s = s.regex(/^[A-Za-z]{2,3}$/, `${field.name} must be a valid country code`);
                }

                // Length/pattern constraints
                for (const { type, value } of field.constraints ?? []) {
                    if (type === "MIN_LENGTH" && isNum(value))
                        s = s.min(toNum(value!), `${field.name} is too short`);
                    if (type === "MAX_LENGTH" && isNum(value))
                        s = s.max(toNum(value!), `${field.name} is too long`);
                    if (type === "PATTERN" && value)
                        s = s.regex(new RegExp(value), `${field.name} is invalid`);
                }
                schema = s;
                break;
            }

            case "NUMBER": {
                let n = z.coerce.number({ required_error: `${field.name} is required` });

                const t = getTypeConstraint(field);
                if (t === "INTEGER") n = n.int(`${field.name} must be an integer`);
                if (t === "POSITIVE") n = n.positive(`${field.name} must be positive`);
                if (t === "NEGATIVE") n = n.negative(`${field.name} must be negative`);

                // Your enum doesn't include MIN/MAX; map MIN_LENGTH/MAX_LENGTH to numeric min/max
                for (const { type, value } of field.constraints ?? []) {
                    if (type === "MIN_LENGTH" && isNum(value))
                        n = n.min(toNum(value!), `${field.name} is too small`);
                    if (type === "MAX_LENGTH" && isNum(value))
                        n = n.max(toNum(value!), `${field.name} is too large`);
                    // PATTERN rarely applies to number, ignore safely
                }
                schema = n;
                break;
            }

            case "DATE": {
                // Keep as string in form, validate ISO (or "yyyy-mm-dd")
                schema = z
                    .string({ required_error: `${field.name} is required` })
                    .refine((v) => isDate(v), `${field.name} is invalid`);
                break;
            }

            case "BOOLEAN": {
                schema = z.boolean({ required_error: `${field.name} is required` });
                break;
            }

            case "SELECT": {
                schema = z
                    .string({ required_error: `${field.name} is required` })
                    .refine(
                        (v) => field.options.includes(v),
                        `${field.name} must be one of: ${field.options.join(", ")}`
                    );
                break;
            }

            case "MULTISELECT": {
                schema = z
                    .array(z.string())
                    .refine(
                        (arr) => arr.every((v) => field.options.includes(v)),
                        `${field.name} contains invalid options`
                    );
                break;
            }

            case "OBJECT": {
                // Build object schema from children[] (array)
                const childMap = field.children.reduce<
                    Record<string, ClientTemplateFieldStructure>
                >((acc, c) => ((acc[c.name] = c), acc), {});
                schema = createDynamicClientSchema(childMap);
                break;
            }

            default:
                schema = z.any();
        }

        // Enforce required on OBJECTs too
        fields[key] = field.required ? schema : schema.optional();
    }

    return z.object(fields);
};

export const buildDefaultAttributes = (structure: Record<string, ClientTemplateFieldStructure>) => {
    const out: Record<string, any> = {};

    for (const [key, field] of Object.entries(structure)) {
        if (field.type === "OBJECT") {
            const childMap = field.children.reduce<Record<string, ClientTemplateFieldStructure>>(
                (acc, c) => ((acc[c.name] = c), acc),
                {}
            );
            out[key] = coerceDefaultForField(field);
            // Ensure nested defaults, even if defaultValue missing
            out[key] = {
                ...out[key],
                ...buildDefaultAttributes(childMap),
            };
        } else {
            out[key] = coerceDefaultForField(field);
        }
    }

    return out;
};
