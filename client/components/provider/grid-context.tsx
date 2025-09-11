import { GridStack } from "gridstack";
import { createContext } from "react";

export const GridContext = createContext<GridStack | null>(null);
