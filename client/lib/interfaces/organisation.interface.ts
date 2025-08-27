// organisation.interface.ts
import { components, operations } from "@/lib/types/types";

// --- 🎯 Core Models ---
export type Organisation = components["schemas"]["Organisation"] & {
    tileLayout?: TileLayoutConfig;
    members?: OrganisationMember[];
};
export type OrganisationMember = components["schemas"]["OrganisationMember"];
export type OrganisationInvite = components["schemas"]["OrganisationInvite"];

// --- 🎨 Tile Layout Types ---
export interface TileLayoutConfig {
    sections: TileSection[];
    spacing: number;
    showAvatar: boolean;
    showPlan: boolean;
    showMemberCount: boolean;
    showMemberSince: boolean;
    showRole: boolean;
    showCustomAttributes: boolean;
    showAddress: boolean;
    showPaymentInfo: boolean;
    showBusinessNumber: boolean;
    showTaxId: boolean;
}

export interface TileSection {
    id: string;
    type: "avatar" | "info" | "details" | "custom";
    title: string;
    visible: boolean;
    order: number;
    width: number;
    height: number;
    x: number;
    y: number;
    customAttributes?: string[];
}

// -- - 🔗 API Request Models ---
export type OrganisationCreationRequest =
    components["schemas"]["OrganisationCreationRequest"];

// --- 📦 Request Payloads ---
export type CreateOrganisationRequest =
    operations["createOrganisation"]["requestBody"]["content"]["application/json"];
export type UpdateOrganisationRequest =
    operations["updateOrganisation"]["requestBody"]["content"]["application/json"];
export type UpdateMemberRoleRequest =
    operations["updateMemberRole"]["requestBody"]["content"]["application/json"];
export type RemoveMemberFromOrganisationRequest =
    operations["removeMemberFromOrganisation"]["requestBody"]["content"]["application/json"];
// Invites and deletions do not have request bodies

// --- 📬 Response Payloads ---
export type CreateOrganisationResponse =
    operations["createOrganisation"]["responses"]["200"]["content"]["*/*"];
export type UpdateOrganisationResponse =
    operations["updateOrganisation"]["responses"]["200"]["content"]["*/*"];
export type GetOrganisationResponse =
    operations["getOrganisation"]["responses"]["200"]["content"]["*/*"];
export type UpdateMemberRoleResponse =
    operations["updateMemberRole"]["responses"]["200"]["content"]["*/*"];
export type InviteToOrganisationResponse =
    operations["inviteToOrganisation"]["responses"]["200"]["content"]["*/*"];
export type GetOrganisationInvitesResponse =
    operations["getOrganisationInvites"]["responses"]["200"]["content"]["*/*"];
export type GetUserInvitesResponse =
    operations["getUserInvites"]["responses"]["200"]["content"]["*/*"];

// --- 📎 Path Parameters ---
export type GetOrganisationPathParams =
    operations["getOrganisation"]["parameters"]["path"];
export type DeleteOrganisationPathParams =
    operations["deleteOrganisation"]["parameters"]["path"];
export type UpdateMemberRolePathParams =
    operations["updateMemberRole"]["parameters"]["path"];
export type InviteToOrganisationPathParams =
    operations["inviteToOrganisation"]["parameters"]["path"];
export type RejectInvitePathParams =
    operations["rejectInvite"]["parameters"]["path"];
export type AcceptInvitePathParams =
    operations["acceptInvite"]["parameters"]["path"];
export type GetOrganisationInvitesPathParams =
    operations["getOrganisationInvites"]["parameters"]["path"];
export type RemoveMemberFromOrganisationPathParams =
    operations["removeMemberFromOrganisation"]["parameters"]["path"];
export type RevokeInvitePathParams =
    operations["revokeInvite"]["parameters"]["path"];

// --- 🧮 Query Parameters ---
export type GetOrganisationQueryParams =
    operations["getOrganisation"]["parameters"]["query"];
