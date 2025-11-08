import { FC, ReactNode, useEffect, useRef } from "react";

/**
 * Wrapper component that triggers a callback once the portal content is mounted
 */
export const PortalContentWrapper: FC<{
    widgetId: string;
    onMount: () => void;
    children: ReactNode;
}> = ({ widgetId, onMount, children }) => {
    const mountedRef = useRef(false);

    useEffect(() => {
        if (!mountedRef.current) {
            mountedRef.current = true;
            onMount();
        }
    }, [onMount]);

    return <>{children}</>;
};
