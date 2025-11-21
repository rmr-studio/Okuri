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
export type BlockTreeLayout = components["schemas"]["BlockTreeLayout"];
