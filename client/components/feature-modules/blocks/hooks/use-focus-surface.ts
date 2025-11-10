import { MutableRefObject, useCallback, useEffect, useMemo } from "react";
import {
    FocusBehaviorOptions,
    FocusLock,
    FocusSurfaceRegistration,
    FocusSurfaceType,
    useBlockFocus,
} from "../context/block-focus-provider";

interface UseFocusSurfaceOptions {
    id: string;
    type: FocusSurfaceType;
    parentId?: string | null;
    order?: number;
    elementRef?: MutableRefObject<HTMLElement | null>;
    onDelete?: () => void;
    metadata?: Record<string, unknown>;
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

    const registration: FocusSurfaceRegistration = useMemo(
        () => ({
            id: options.id,
            type: options.type,
            parentId: options.parentId,
            order: options.order,
            elementRef: options.elementRef,
            onDelete: options.onDelete,
            metadata: options.metadata,
        }),
        [
            options.id,
            options.type,
            options.parentId,
            options.order,
            options.elementRef,
            options.onDelete,
            options.metadata,
        ]
    );

    useEffect(() => {
        return registerSurface(registration);
    }, [registerSurface, registration]);

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

    const locks = useMemo(() => Array.from(state.locks.values()), [state]);

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
