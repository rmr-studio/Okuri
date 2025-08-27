import { components, operations } from "@/lib/types/types";

// --- 🎯 Core Invoice Models ---
export type Invoice = components["schemas"]["Invoice"];
export type Billable = components["schemas"]["Billable"];
export type LineItem = components["schemas"]["LineItem"];
export type InvoiceCreationRequest = components["schemas"]["InvoiceCreationRequest"];
export type Client = components["schemas"]["Client"];
export type Address = components["schemas"]["Address"];

// --- 📦 Request Payloads ---
export type CreateInvoiceRequest =
    operations["createInvoice"]["requestBody"]["content"]["application/json"];
export type UpdateInvoiceRequest =
    operations["updateInvoice"]["requestBody"]["content"]["application/json"];
export type CancelInvoiceRequest =
    operations["cancelInvoice"]["requestBody"]["content"]["application/json"];
export type DeleteInvoiceRequest =
    operations["deleteInvoice"]["requestBody"]["content"]["application/json"];
export type GetClientInvoicesRequest =
    operations["getClientInvoices"]["requestBody"]["content"]["application/json"];
// No request body for getInvoiceById, getUserInvoices, or generateInvoiceDocument

// --- 📬 Response Payloads ---
export type GetInvoiceByIdResponse =
    operations["getInvoiceById"]["responses"]["200"]["content"]["*/*"];
export type GetUserInvoicesResponse =
    operations["getUserInvoices"]["responses"]["200"]["content"]["*/*"];
export type GetClientInvoicesResponse =
    operations["getClientInvoices"]["responses"]["200"]["content"]["*/*"];
export type CreateInvoiceResponse =
    operations["createInvoice"]["responses"]["201"]["content"]["*/*"];
export type UpdateInvoiceResponse =
    operations["updateInvoice"]["responses"]["200"]["content"]["*/*"];
export type CancelInvoiceResponse =
    operations["cancelInvoice"]["responses"]["200"]["content"]["*/*"];
export type GenerateInvoiceDocumentResponse =
    operations["generateInvoiceDocument"]["responses"]["200"]["content"]["*/*"];
// No response body for deleteInvoice

// --- 📎 Path Parameters ---
export type GetInvoiceByIdPathParams = operations["getInvoiceById"]["parameters"]["path"];
export type UpdateInvoicePathParams = operations["updateInvoice"]["parameters"]["path"];
export type DeleteInvoicePathParams = operations["deleteInvoice"]["parameters"]["path"];
export type CancelInvoicePathParams = operations["cancelInvoice"]["parameters"]["path"];
export type GenerateInvoiceDocumentPathParams =
    operations["generateInvoiceDocument"]["parameters"]["path"];

// --- 🧮 Query Parameters ---
// No query parameters defined for invoice-related operations
