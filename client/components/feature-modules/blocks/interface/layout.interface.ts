import { components } from "@/lib/types/types";

// Grid layout helpers used by block/render components
export type GridRect = components["schemas"]["GridRect"];
export type LayoutGrid = components["schemas"]["LayoutGrid"];
export type LayoutGridItem = components["schemas"]["LayoutGridItem"];




/**
 * Represents a persisted block tree layout with multi-tenant support.
 *
 * This matches the backend BlockTreeLayoutEntity structure and supports
 * layout resolution by scope (USER > TEAM > ORGANIZATION).
 */
export type BlockTreeLayout = components["schemas"]["BlockTreeLayout"];
