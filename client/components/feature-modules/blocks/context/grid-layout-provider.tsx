import { ChildNodeProps } from "@/lib/interfaces/interface";
import {
    createContext,
    Dispatch,
    FC,
    SetStateAction,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { GridRect } from "../interface/block.interface";
import { useCachedNode } from "@dnd-kit/core/dist/hooks/utilities";

interface GridLayoutContextValue {
    activeAction: boolean;
    setActiveAction: Dispatch<SetStateAction<boolean>>;
    layouts: Map<string, GridRect>;
    setLayouts: Dispatch<SetStateAction<Map<string, GridRect>>>;
}

interface GridLayoutProviderProps extends ChildNodeProps {
    organisationId: string;
}

export const GridLayoutContext = createContext<GridLayoutContextValue | null>(null);

/**
 * The GridLayoutProvider is responsible for keeping a current layout/dimension map for all blocks in the environment.
 * This is so we can consistently persist an updated layout state as blocks are moved/resized within GridStack so that
 * the rendered layout always reflects the latest state.
 */
export const GridLayoutProvider: FC<GridLayoutProviderProps> = ({ organisationId, children }) => {
    const [layouts, setLayouts] = useState<Map<string, GridRect>>(new Map());
    const [activeAction, setActiveAction] = useState<boolean>(false);

    useEffect(() => {
        console.log(layouts);
    }, [layouts]);

    const value = useMemo<GridLayoutContextValue>(
        () => ({
            activeAction,
            setActiveAction,
            layouts,
            setLayouts,
        }),
        [activeAction, layouts, setActiveAction, setLayouts]
    );

    return <GridLayoutContext.Provider value={value}>{children}</GridLayoutContext.Provider>;
};

/** Hook wrapper for the context. */
export const useGridLayout = (): GridLayoutContextValue => {
    const context = useContext(GridLayoutContext);
    if (!context) {
        throw new Error("useGridLayout must be used within GridLayoutProvider");
    }
    return context;
};
