import { useGrid } from "@/components/feature-modules/blocks/context/grid-provider";
import { GridStack, GridStackElement } from "gridstack";
import { useCallback, useEffect, useRef } from "react";

type RefCallback = (instance: HTMLDivElement | null) => void;

const BUFFER_PX = 4;
const DEFAULT_ROW_HEIGHT = 40;

const getWidgetElement = (grid: GridStack, widgetId: string): GridStackElement | null => {
    const root = grid.el;
    if (!root) return null;

    const safeId =
        typeof window !== "undefined" && window.CSS?.escape
            ? window.CSS.escape(widgetId)
            : widgetId.replace(/([ #;?%&,.+*~':"!^$[\]()=>|/@])/g, "\\$1");

    return root.querySelector(`[gs-id="${safeId}"]`) as GridStackElement | null;
};

const parseNumeric = (value: unknown): number | null => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string") {
        const parsed = parseFloat(value);
        if (!Number.isNaN(parsed)) {
            return parsed;
        }
    }
    return null;
};

const deriveRowSize = (grid: GridStack, widget: HTMLElement, currentRows: number): number => {
    const rect = widget.getBoundingClientRect();
    if (rect.height > 0 && currentRows > 0) {
        return rect.height / currentRows;
    }

    const cellHeight = parseNumeric(grid.opts?.cellHeight) ?? DEFAULT_ROW_HEIGHT;
    const marginOpt = grid.opts?.margin;
    let verticalMargin: number | null = null;

    if (Array.isArray(marginOpt)) {
        verticalMargin = parseNumeric(marginOpt[0]);
    } else {
        verticalMargin = parseNumeric(marginOpt);
    }

    const margin = verticalMargin ?? 0;
    return cellHeight + margin;
};

export const usePanelAutoResize = (widgetId: string): RefCallback => {
    const { gridStack } = useGrid();
    const elementRef = useRef<HTMLDivElement | null>(null);
    const observerRef = useRef<ResizeObserver | null>(null);
    const frameRef = useRef<number | null>(null);

    const cleanupObserver = useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
        }

        if (observerRef.current && elementRef.current) {
            observerRef.current.unobserve(elementRef.current);
        }

        observerRef.current?.disconnect();
        observerRef.current = null;
    }, []);

    const measure = useCallback(() => {
        if (!gridStack || !elementRef.current) return;
        const widgetEl = getWidgetElement(gridStack, widgetId) as (HTMLElement & {
            gridstackNode?: { grid?: GridStack };
        }) | null;
        if (!widgetEl) return;

        const owningGrid = widgetEl.gridstackNode?.grid ?? gridStack;
        if (!owningGrid) return;

        if (
            widgetEl.classList.contains("ui-resizable-resizing") ||
            widgetEl.classList.contains("ui-draggable-dragging")
        ) {
            return;
        }

        const scrollHeight = elementRef.current.scrollHeight + BUFFER_PX;
        const currentRows = parseInt(widgetEl.getAttribute("gs-h") ?? "1", 10) || 1;
        if (currentRows <= 0) return;

        const rowSize = deriveRowSize(owningGrid, widgetEl, currentRows);
        if (!Number.isFinite(rowSize) || rowSize <= 0) return;

        const requiredRows = Math.max(1, Math.ceil(scrollHeight / rowSize));
        if (requiredRows === currentRows) return;

        owningGrid.update(widgetEl, { h: requiredRows, minH: requiredRows });
    }, [gridStack, widgetId]);

    const scheduleMeasure = useCallback(() => {
        if (frameRef.current !== null) {
            cancelAnimationFrame(frameRef.current);
        }
        frameRef.current = requestAnimationFrame(() => {
            frameRef.current = null;
            measure();
        });
    }, [measure]);

    const setRef = useCallback<RefCallback>(
        (node) => {
            if (node === elementRef.current) return;

            cleanupObserver();
            elementRef.current = node;

            if (!node || typeof ResizeObserver === "undefined") {
                return;
            }

            const observer = new ResizeObserver(() => scheduleMeasure());
            observer.observe(node);
            observerRef.current = observer;

            scheduleMeasure();
        },
        [cleanupObserver, scheduleMeasure]
    );

    useEffect(() => {
        scheduleMeasure();
    }, [scheduleMeasure, gridStack]);

    useEffect(() => {
        return () => {
            cleanupObserver();
        };
    }, [cleanupObserver]);

    return setRef;
};
