import { GridStack } from "gridstack";
import { createContext } from "react";

const GridContext = createContext<GridStack | null>(null);

export function GridstackProvider({ children, options = {} }) {
// shared options across grids (columns, margin, etc.)
return (
<GridstackContext.Provider value={{ options }}>{children}</GridstackContext.Provider>
);
}