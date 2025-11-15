import { FC, ReactNode, useEffect, useRef } from "react";
import { useLayoutChange } from "../../context/layout-change-provider";

/**
 * Wrapper component that triggers a callback once the portal content is mounted
 */
export const PortalContentWrapper: FC<{
    widgetId: string;
    onMount: () => void;
    children: ReactNode;
}> = ({ widgetId, onMount, children }) => {
    const mountedRef = useRef(false);
    const { localVersion } = useLayoutChange();

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            onMount();
        }
    }, [onMount]);

    return (
        <div
            className="grid-render-root"
            key={`${widgetId}-${localVersion}`}
            data-widget-id={widgetId}
        >
            {children}
        </div>
    );
};
