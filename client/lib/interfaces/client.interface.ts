import { components, operations } from "@/lib/types/types";

// --- 🎯 Core Client Models ---
export type Client = components["schemas"]["Client"];
export type ClientCreationRequest =
    components["schemas"]["ClientCreationRequest"];
export type ContactDetails = components["schemas"]["ContactDetails"];
export type Address = components["schemas"]["Address"];

// --- 🎨 Template & Field Structure Types ---
export type ClientTemplateFieldStructure =
    components["schemas"]["ClientTemplateFieldStructure"];
export type TemplateClientTemplateFieldStructure =
    components["schemas"]["TemplateClientTemplateFieldStructure"];
export type Constraint = components["schemas"]["Constraint"];

// --- 📦 Request Payloads ---
export type CreateClientRequest =
    operations["createClient"]["requestBody"]["content"]["application/json"];
export type UpdateClientRequest =
    operations["updateClient"]["requestBody"]["content"]["application/json"];
// No request body for getClientById, getClientsForUser, or deleteClientById

// --- 📬 Response Payloads ---
export type GetClientByIdResponse =
    operations["getClientById"]["responses"]["200"]["content"]["*/*"];
export type GetOrganisationClientsResponse =
    operations["getOrganisationClients"]["responses"]["200"]["content"]["*/*"];
export type CreateClientResponse =
    operations["createClient"]["responses"]["201"]["content"]["*/*"];
export type UpdateClientResponse =
    operations["updateClient"]["responses"]["200"]["content"]["*/*"];
// No response body for deleteClientById

// --- 📎 Path Parameters ---
export type GetClientByIdPathParams =
    operations["getClientById"]["parameters"]["path"];
export type UpdateClientPathParams =
    operations["updateClient"]["parameters"]["path"];
export type DeleteClientByIdPathParams =
    operations["deleteClientById"]["parameters"]["path"];

// --- 🧮 Query Parameters ---
// No query parameters defined for client-related operations

// --- 🔧 Field Type Enums ---
export type ClientFieldType = ClientTemplateFieldStructure["type"];
export type ClientFieldConstraint = Constraint["type"];
