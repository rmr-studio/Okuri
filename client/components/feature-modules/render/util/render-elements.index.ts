import { blockElements } from "@/components/feature-modules/blocks/util/block.registry";
import { WIDGETS } from "@/components/feature-modules/grid/util/widget.registry";
import { RenderElementRegistry } from "./render-element.registry";

export const renderElementsByCategory: Record<
    "BLOCK" | "GRID_WIDGET",
    RenderElementRegistry
> = {
    BLOCK: blockElements,
    GRID_WIDGET: WIDGETS,
};

export const renderElements: RenderElementRegistry = {
    ...blockElements,
    ...Object.fromEntries(
        Object.entries(WIDGETS).filter(([key]) => !(key in blockElements))
    ),
};
