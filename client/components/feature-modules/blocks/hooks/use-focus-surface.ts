import { MutableRefObject, useCallback, useEffect, useMemo, useRef } from "react";
import {
    FocusBehaviorOptions,
    FocusLock,
    FocusSurfaceRegistration,
    FocusSurfaceType,
    useBlockFocus,
} from "../context/block-focus-provider";
import { useBlockEnvironment } from "../context/block-environment-provider";

interface UseFocusSurfaceOptions {
    id: string;
    type: FocusSurfaceType;
    parentId?: string | null;
    order?: number;
    elementRef?: MutableRefObject<HTMLElement | null>;
    onDelete?: () => void;
    metadata?: Record<string, unknown>;
    focusParentOnDelete?: boolean;
}

export interface FocusSurfaceControls {
    isFocused: boolean;
    isSelected: boolean;
    isHovered: boolean;
    selection: string[];
    focusSelf: (options?: FocusBehaviorOptions) => void;
    setHovered: (hovering: boolean) => void;
    disableHover: boolean;
    disableSelect: boolean;
}

/**
 * Registers a block surface with the BlockFocusProvider and exposes derived focus state.
 */
export const useFocusSurface = (options: UseFocusSurfaceOptions): FocusSurfaceControls => {
    const {
        state,
        registerSurface,
        updateSurface,
        focusSurface,
        setHoveredSurface,
        updateStackEntry,
    } = useBlockFocus();
    const { getParentId } = useBlockEnvironment();

    // Store refs to avoid re-registration when these change
    const focusSurfaceRef = useRef(focusSurface);
    const getParentIdRef = useRef(getParentId);
    const stateRef = useRef(state);

    useEffect(() => {
        focusSurfaceRef.current = focusSurface;
        getParentIdRef.current = getParentId;
        stateRef.current = state;
    });

    // Only register with stable ID and type to avoid re-registration on every render.
    // Mutable properties (onDelete, metadata, etc.) are updated via updateSurface below.
    const registration: FocusSurfaceRegistration = useMemo(
        () => ({
            id: options.id,
            type: options.type,
        }),
        [options.id, options.type]
    );

    useEffect(() => {
        const cleanup = registerSurface(registration);

        // Return cleanup that focuses parent if requested
        return () => {
            // Check if this surface is currently focused before cleanup
            const wasFocused = stateRef.current.primaryFocusId === options.id;

            // Run the original cleanup
            cleanup();

            // If this surface was focused and should focus parent on delete, do it
            if (wasFocused && options.focusParentOnDelete) {
                const parentId = getParentIdRef.current(options.id);
                if (parentId) {
                    // Use setTimeout to ensure the parent surface is still registered
                    // after our cleanup completes
                    setTimeout(() => {
                        focusSurfaceRef.current(parentId, { emitStackEntry: true });
                    }, 0);
                }
            }
        };
    }, [registerSurface, registration, options.id, options.focusParentOnDelete]);

    useEffect(() => {
        updateSurface(options.id, {
            onDelete: options.onDelete,
            metadata: options.metadata,
            parentId: options.parentId,
            order: options.order,
            elementRef: options.elementRef,
        });
    }, [
        options.elementRef,
        options.id,
        options.metadata,
        options.onDelete,
        options.order,
        options.parentId,
        updateSurface,
    ]);

    // Convert locks Map to array. Recomputes on each render but is inexpensive.
    // Using useMemo with [state] would cause unnecessary recomputation on every context change.
    // Using [state.locks] wouldn't recompute when locks change (since it's a stable ref).
    const locks = Array.from(state.locks.values());

    const lockApplies = useCallback(
        (lock: FocusLock) => {
            if (lock.scope === "surface" && lock.surfaceId) {
                return lock.surfaceId !== options.id;
            }
            return true;
        },
        [options.id]
    );

    useEffect(() => {
        if (!options.onDelete) return;
        if (state.primaryFocusId !== options.id) return;
        updateStackEntry({
            id: options.id,
            type: options.type,
            onDelete: options.onDelete,
        });
    }, [options.id, options.onDelete, options.type, state.primaryFocusId, updateStackEntry]);

    const disableHover = useMemo(() => {
        return locks.some((lock) => lock.suppressHover && lockApplies(lock));
    }, [locks, lockApplies]);

    const disableSelect = useMemo(() => {
        return locks.some((lock) => lock.suppressSelection && lockApplies(lock));
    }, [locks, lockApplies]);

    const focusSelf = useCallback(
        (behavior?: FocusBehaviorOptions) => {
            if (disableSelect) return;
            focusSurface(options.id, { emitStackEntry: true, ...behavior });
        },
        [focusSurface, options.id, disableSelect]
    );

    const setHovered = useCallback(
        (hovering: boolean) => {
            if (disableHover) return;

            setHoveredSurface(hovering ? options.id : null);
        },
        [options.id, setHoveredSurface, disableHover]
    );

    const isFocused = state.primaryFocusId === options.id;
    const isSelected = !disableSelect && state.selection.includes(options.id);
    const isHovered = !disableHover && state.hoveredSurfaceId === options.id;

    return {
        isFocused,
        isSelected,
        isHovered,
        selection: state.selection,
        focusSelf,
        setHovered,
        disableHover,
        disableSelect,
    };
};
