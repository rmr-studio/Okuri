import { GridStackOptions } from "gridstack";
import { components } from "@/lib/types/types";

// Grid layout helpers used by block/render components
export type GridRect = components["schemas"]["GridRect"];
export type LayoutGrid = components["schemas"]["LayoutGrid"];
export type LayoutGridItem = components["schemas"]["LayoutGridItem"];

/**
 * Layout scope determines who owns and can modify a layout
 */
export enum LayoutScope {
    /** Default layout for entire organization */
    ORGANIZATION = "ORGANIZATION",
    /** Personalized layout for a specific user */
    USER = "USER",
    /** Shared layout for a team */
    TEAM = "TEAM",
}

/**
 * Entity types that can have layouts
 */
export enum EntityType {
    CLIENT = "CLIENT",
    INVOICE = "INVOICE",
    PROJECT = "PROJECT",
    DEMO = "DEMO",
}

/**
 * Represents a persisted block tree layout with multi-tenant support.
 *
 * This matches the backend BlockTreeLayoutEntity structure and supports
 * layout resolution by scope (USER > TEAM > ORGANIZATION).
 */
export interface BlockTreeLayout {
    /** Unique identifier for this layout */
    id: string;

    /** The page/entity this layout applies to (e.g., client-123, invoice-456) */
    entityId: string;

    /** Type of entity (CLIENT, INVOICE, PROJECT, etc.) */
    entityType: EntityType | string;

    /** Organization this layout belongs to */
    organisationId: string;

    /** Scope of this layout (ORGANIZATION, USER, or TEAM) */
    scope: LayoutScope;

    /**
     * Owner of this layout based on scope:
     * - ORGANIZATION scope: null or org admin user id
     * - USER scope: user's UUID
     * - TEAM scope: team's UUID
     */
    ownerId?: string | null;

    /** Complete GridStack layout configuration */
    layout: GridStackOptions;

    /** Audit fields (optional) */
    createdAt?: string;
    updatedAt?: string;
    createdBy?: string;
    updatedBy?: string;
}
