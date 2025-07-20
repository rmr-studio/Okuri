import { components, operations } from "@/lib/types/types";

// --- 🎯 Core Client Models ---
export type Client = components["schemas"]["Client"];
export type ClientCreationRequest = components["schemas"]["ClientCreationRequest"];
export type ContactDetails = components["schemas"]["ContactDetails"];
export type ClientFieldType = components["schemas"]["ClientTemplateFieldStructure"]['type'];
export type ClientFieldConstraint = components["schemas"]["Constraint"]["type"];

// --- 📦 Request Payloads ---
export type CreateClientRequest =
    operations["createClient"]["requestBody"]["content"]["application/json"];
export type UpdateClientRequest =
    operations["updateClient"]["requestBody"]["content"]["application/json"];
// No request body for getClientById, getClientsForUser, or deleteClientById

// --- 📬 Response Payloads ---
export type GetClientByIdResponse =
    operations["getClientById"]["responses"]["200"]["content"]["*/*"];
export type GetClientsForUserResponse =
    operations["getClientsForUser"]["responses"]["200"]["content"]["*/*"];
export type CreateClientResponse = operations["createClient"]["responses"]["201"]["content"]["*/*"];
export type UpdateClientResponse = operations["updateClient"]["responses"]["200"]["content"]["*/*"];
// No response body for deleteClientById

// --- 📎 Path Parameters ---
export type GetClientByIdPathParams = operations["getClientById"]["parameters"]["path"];
export type UpdateClientPathParams = operations["updateClient"]["parameters"]["path"];
export type DeleteClientByIdPathParams = operations["deleteClientById"]["parameters"]["path"];

// --- 🧮 Query Parameters ---
// No query parameters defined for client-related operations
