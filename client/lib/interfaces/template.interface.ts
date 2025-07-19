import { components } from "../types/types";

export type ClientTemplateFieldStructure = components["schemas"]["ClientTemplateFieldStructure"];
export type TemplateClientTemplateFieldStructure =
    components["schemas"]["TemplateClientTemplateFieldStructure"];
export type FieldClientFieldType = components["schemas"]["FieldClientFieldType"];
export type ClientFieldConstraint =
    | "MIN_LENGTH"
    | "MAX_LENGTH"
    | "PATTERN"
    | "REQUIRED"
    | "UNIQUE"
    | "CUSTOM";

export type InvoiceTemplateFieldStructure = components["schemas"]["InvoiceTemplateFieldStructure"];
export type TemplateInvoiceTemplateFieldStructure =
    components["schemas"]["TemplateInvoiceTemplateFieldStructure"];
export type FieldInvoiceFieldType = components["schemas"]["FieldInvoiceFieldType"];

export type ReportTemplateFieldStructure = components["schemas"]["ReportTemplateFieldStructure"];
export type TemplateReportTemplateFieldStructure =
    components["schemas"]["TemplateReportTemplateFieldStructure"];
export type FieldReportFieldType = components["schemas"]["FieldReportFieldType"];
