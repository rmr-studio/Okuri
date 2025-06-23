import { components, operations } from "@/lib/types/types";

// --- 🎯 Core User Models ---
export type User = components["schemas"]["User"];
export type Address = components["schemas"]["Address"];
export type Company = components["schemas"]["Company"];
export type ChargeRate = components["schemas"]["ChargeRate"];
export type Payment = components["schemas"]["Payment"];

// --- 📦 Request Payloads ---
export type UpdateUserProfileRequest =
    operations["updateUserProfile"]["requestBody"]["content"]["application/json"];
// No request body for getCurrentUser, getUserById, or deleteUserProfileById

// --- 📬 Response Payloads ---
export type GetCurrentUserResponse =
    operations["getCurrentUser"]["responses"]["200"]["content"]["*/*"];
export type GetUserByIdResponse = operations["getUserById"]["responses"]["200"]["content"]["*/*"];
export type UpdateUserProfileResponse =
    operations["updateUserProfile"]["responses"]["200"]["content"]["*/*"];
// No response body for deleteUserProfileById

// --- 📎 Path Parameters ---
export type GetUserByIdPathParams = operations["getUserById"]["parameters"]["path"];
export type DeleteUserProfileByIdPathParams =
    operations["deleteUserProfileById"]["parameters"]["path"];

// --- 🧮 Query Parameters ---
// No query parameters defined for user-related operations
