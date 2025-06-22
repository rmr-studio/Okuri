// user.interface.ts
import { components, operations } from "@/lib/types/types";

// --- 🎯 Core User Models ---
export type User = components["schemas"]["User"];
export type UserProfile = components["schemas"]["UserProfile"];

// --- 📦 Request Payloads ---
export type UpdateUserProfileRequest =
    operations["updateUserProfile"]["requestBody"]["content"]["application/json"];
export type RemoveMemberFromOrganisationRequest =
    operations["removeMemberFromOrganisation"]["requestBody"]["content"]["application/json"];
// No request body for getCurrentUser, getUserProfileById, or deleteUserProfileById

// --- 📬 Response Payloads ---
export type GetCurrentUserResponse =
    operations["getCurrentUser"]["responses"]["200"]["content"]["*/*"];
export type UpdateUserProfileResponse =
    operations["updateUserProfile"]["responses"]["200"]["content"]["*/*"];
export type GetUserProfileByIdResponse =
    operations["getUserProfileById"]["responses"]["200"]["content"]["*/*"];
export type GetBatchUserDisplayByIdsResponse =
    operations["getBatchUserDisplayByIds"]["responses"]["200"]["content"]["*/*"];
// No response body for deleteUserProfileById

// --- 📎 Path Parameters ---
export type GetUserProfileByIdPathParams =
    operations["getUserProfileById"]["parameters"]["path"];
export type DeleteUserProfileByIdPathParams =
    operations["deleteUserProfileById"]["parameters"]["path"];

// --- 🧮 Query Parameters ---
export type GetBatchUserDisplayByIdsQueryParams =
    operations["getBatchUserDisplayByIds"]["parameters"]["query"];
