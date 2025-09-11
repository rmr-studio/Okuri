import GridStack from 'gridstack'
import { useEffect, useRef } from "react";
import "gridstack/dist/gridstack.min.css";

export const useGrid = () => {
    const gridRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!gridRef.current) return;

        // Initialize GridStack
        const grid = GridStack.init(
            {
                cellHeight: 100,
                float: true,
                column: 12,
            },
            gridRef.current
        );

        return () => {
            grid.destroy(false); // cleanup on unmount
        };
    }, []);
};
