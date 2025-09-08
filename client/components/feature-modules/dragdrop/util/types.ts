// dragdrop/types.ts
import { ReactNode } from "react";

export type BlockDirection = "row" | "column";

export interface BlockBehaviors {
  draggable?: boolean;
  sortable?: boolean;
  resizable?: boolean;
  nestable?: boolean;
}

export interface BlockDefinition {
  /** Human-friendly label for menus/tooling */
  label: string;

  /**
   * Leaf renderer (optional for containers).
   * If provided, must accept (id, data?) so it can be used uniformly.
   */
  render?: (id: string | number, data?: any) => ReactNode;

  /** Optional overlay renderer (drag ghost) */
  renderOverlay?: (id: string | number, data?: any) => ReactNode;

  /** Allowed parents (for drop rules) */
  validParents?: string[];

  /** Allowed children (for containers) */
  validChildren?: string[];

  /** Behavior flags (draggable/resizable/nestable/sortable) */
  behaviors?: BlockBehaviors;

  /** Default split orientation for containers */
  direction?: BlockDirection;
}

/** The full registry type */
export type BlockRegistry = Record<string, BlockDefinition>;

/** Runtime block instance (your tree nodes) */
export interface GridBlockProps {
  id: string | number;
  type: string;
  direction?: BlockDirection;
  children?: GridBlockProps[];
  sizes?: number[]; // panel sizes (percentages)
  className?: string;
  onResize?: (id: string | number, sizes: number[]) => void; // used by components
}
