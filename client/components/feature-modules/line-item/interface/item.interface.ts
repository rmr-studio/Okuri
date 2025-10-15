import { components, operations } from "@/lib/types/types";

// --- 🎯 Core LineItem Models ---
export type LineItem = components["schemas"]["LineItem"];
export type LineItemCreationRequest =
    components["schemas"]["LineItemCreationRequest"];
export type Billable = components["schemas"]["Billable"];

// --- 📦 Request Payloads ---
export type CreateLineItemRequest =
    operations["createLineItem"]["requestBody"]["content"]["application/json"];
export type UpdateLineItemRequest =
    operations["updateLineItem"]["requestBody"]["content"]["application/json"];
// No request body for getLineItemById, getLineItemsForUser, or deleteLineItemById

// --- 📬 Response Payloads ---
export type GetLineItemByIdResponse =
    operations["getLineItemById"]["responses"]["200"]["content"]["*/*"];
export type GetLineItemsForOrganisationResponse =
    operations["getLineItemsForOrganisation"]["responses"]["200"]["content"]["*/*"];
export type CreateLineItemResponse =
    operations["createLineItem"]["responses"]["201"]["content"]["*/*"];
export type UpdateLineItemResponse =
    operations["updateLineItem"]["responses"]["200"]["content"]["*/*"];
// No response body for deleteLineItemById

// --- 📎 Path Parameters ---
export type GetLineItemByIdPathParams =
    operations["getLineItemById"]["parameters"]["path"];
export type UpdateLineItemPathParams =
    operations["updateLineItem"]["parameters"]["path"];
export type DeleteLineItemByIdPathParams =
    operations["deleteLineItemById"]["parameters"]["path"];

// --- 🧮 Query Parameters ---
export type GetLineItemsForOrganisationQueryParams =
    operations["getLineItemsForOrganisation"]["parameters"]["path"];

// --- 🔧 Type Enums ---
export type LineItemType = LineItem["type"];
export type BillableType = Billable["billableType"];
