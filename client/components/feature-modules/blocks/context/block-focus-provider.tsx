/**
 * BlockFocusProvider orchestrates focus, hover, and selection state for block surfaces.
 *
 * The provider currently mirrors the legacy single-select behaviour while exposing the
 * primitives required for upcoming multi-select, keyboard navigation, and interaction locks.
 */
"use client";

import {
    MutableRefObject,
    PropsWithChildren,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type FocusSurfaceType = "panel" | "list" | "block";

export interface FocusSurfaceRegistration {
    id: string;
    type: FocusSurfaceType;
    parentId?: string | null;
    order?: number;
    elementRef?: MutableRefObject<HTMLElement | null>;
    onDelete?: () => void;
    metadata?: Record<string, unknown>;
}

export interface FocusStackEntry {
    id: string;
    type: FocusSurfaceType;
    onDelete?: () => void;
}

export interface FocusLock {
    id: string;
    reason?: string;
    suppressHover?: boolean;
    suppressSelection?: boolean;
    suppressKeyboardNavigation?: boolean;
    scope?: "global" | "surface";
    surfaceId?: string;
}

export interface FocusBehaviorOptions {
    preserveSelection?: boolean;
    emitStackEntry?: boolean;
}

export interface FocusSelectionOptions {
    replace?: boolean;
}

interface BlockFocusContextValue {
    state: {
        primaryFocusId: string | null;
        hoveredSurfaceId: string | null;
        selection: string[];
        surfaces: Map<string, FocusSurfaceRegistration>;
        locks: Map<string, FocusLock>;
    };
    registerSurface(registration: FocusSurfaceRegistration): () => void;
    updateSurface(id: string, updates: Partial<FocusSurfaceRegistration>): void;
    focusSurface(id: string | null, options?: FocusBehaviorOptions): void;
    setHoveredSurface(id: string | null): void;
    setSelection(surfaceIds: string[]): void;
    toggleSelection(id: string, options?: FocusSelectionOptions): void;
    clearFocus(): void;
    pushStackEntry(entry: FocusStackEntry): void;
    removeStackEntry(entry: FocusStackEntry): void;
    updateStackEntry(entry: FocusStackEntry): void;
    acquireLock(lock: FocusLock): () => void;
    releaseLock(lockId: string): void;
    isInteractionLocked(predicate?: (lock: FocusLock) => boolean): boolean;
}

const BlockFocusContext = createContext<BlockFocusContextValue | null>(null);

const createSurfaceMap = () => new Map<string, FocusSurfaceRegistration>();
const createLockMap = () => new Map<string, FocusLock>();

export function BlockFocusProvider({ children }: PropsWithChildren) {
    const [primaryFocusId, setPrimaryFocusId] = useState<string | null>(null);
    const [hoveredSurfaceId, setHoveredSurfaceId] = useState<string | null>(null);
    const [selection, setSelection] = useState<string[]>([]);
    const [surfaceVersion, setSurfaceVersion] = useState(0);
    const [lockVersion, setLockVersion] = useState(0);

    const surfacesRef = useRef(createSurfaceMap());
    const locksRef = useRef(createLockMap());
    const stackRef = useRef<FocusStackEntry[]>([]);

    const emitStackEntry = useCallback((entry: FocusStackEntry) => {
        stackRef.current = stackRef.current.filter(
            (item) => !(item.type === entry.type && item.id === entry.id)
        );
        stackRef.current.push(entry);
    }, []);

    const pushStackEntry = useCallback(
        (entry: FocusStackEntry) => {
            emitStackEntry(entry);
        },
        [emitStackEntry]
    );

    const removeStackEntry = useCallback((entry: FocusStackEntry) => {
        stackRef.current = stackRef.current.filter(
            (item) => !(item.type === entry.type && item.id === entry.id)
        );
    }, []);

    const updateStackEntry = useCallback((entry: FocusStackEntry) => {
        const current = stackRef.current.at(-1);
        if (current && current.id === entry.id && current.type === entry.type) {
            stackRef.current[stackRef.current.length - 1] = entry;
        }
    }, []);

    const updateSurface = useCallback((id: string, updates: Partial<FocusSurfaceRegistration>) => {
        const current = surfacesRef.current.get(id);
        if (!current) return;

        // Check if any non-function values actually changed to avoid unnecessary re-renders.
        // Functions (like onDelete) are always updated but don't trigger version increment
        // since they're recreated on every render but functionally equivalent.
        let hasChanges = false;
        for (const key in updates) {
            const currentVal = current[key as keyof FocusSurfaceRegistration];
            const newVal = updates[key as keyof Partial<FocusSurfaceRegistration>];
            // Skip function comparisons - they change every render but are functionally equivalent
            if (typeof newVal !== 'function' && currentVal !== newVal) {
                hasChanges = true;
                break;
            }
        }

        // Always update the ref (to get latest callbacks), but only increment version if data changed
        surfacesRef.current.set(id, { ...current, ...updates });

        if (hasChanges) {
            setSurfaceVersion((version) => version + 1);
        }
    }, []);

    const registerSurface = useCallback(
        (registration: FocusSurfaceRegistration) => {
            surfacesRef.current.set(registration.id, registration);
            setSurfaceVersion((version) => version + 1);

            return () => {
                surfacesRef.current.delete(registration.id);
                removeStackEntry({ id: registration.id, type: registration.type });
                setSurfaceVersion((version) => version + 1);
                setSelection((prev) => prev.filter((item) => item !== registration.id));
                setPrimaryFocusId((prev) => (prev === registration.id ? null : prev));
            };
        },
        [removeStackEntry]
    );

    const focusSurface = useCallback(
        (id: string | null, options?: FocusBehaviorOptions) => {
            setPrimaryFocusId(id);
            if (!options?.preserveSelection) {
                setSelection(id ? [id] : []);
            }
            if (id && options?.emitStackEntry) {
                const surface = surfacesRef.current.get(id);
                if (surface) {
                    emitStackEntry({
                        id: surface.id,
                        type: surface.type,
                        onDelete: surface.onDelete,
                    });
                }
            }
        },
        [emitStackEntry]
    );

    const clearFocus = useCallback(() => {
        setPrimaryFocusId(null);
        setHoveredSurfaceId(null);
        setSelection([]);
        stackRef.current = [];
    }, []);

    const toggleSelection = useCallback((id: string, options?: FocusSelectionOptions) => {
        setSelection((prev) => {
            if (options?.replace) {
                return [id];
            }
            const exists = prev.includes(id);
            if (exists) {
                return prev.filter((entry) => entry !== id);
            }
            return [...prev, id];
        });
    }, []);

    const acquireLock = useCallback((lock: FocusLock) => {
        locksRef.current.set(lock.id, lock);
        setLockVersion((version) => version + 1);
        return () => {
            locksRef.current.delete(lock.id);
            setLockVersion((version) => version + 1);
        };
    }, []);

    const releaseLock = useCallback((lockId: string) => {
        if (!locksRef.current.has(lockId)) return;
        locksRef.current.delete(lockId);
        setLockVersion((version) => version + 1);
    }, []);

    const isInteractionLocked = useCallback((predicate?: (lock: FocusLock) => boolean) => {
        const activeLocks = Array.from(locksRef.current.values());
        if (!predicate) {
            return activeLocks.length > 0;
        }
        return activeLocks.some(predicate);
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        const controller = new AbortController();
        const { signal } = controller;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== "Delete" && event.key !== "Backspace") return;

            const activeElement = document.activeElement as HTMLElement | null;
            if (activeElement) {
                const tag = activeElement.tagName;
                const isFormElement =
                    tag === "INPUT" || tag === "TEXTAREA" || activeElement.isContentEditable;
                if (isFormElement) return;
            }

            const current = stackRef.current.at(-1);
            if (!current?.onDelete) return;
            event.preventDefault();
            current.onDelete();
        };

        const handlePointerDown = (event: PointerEvent) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (target.closest("[data-block-id]")) return;
            if (target.closest("[data-surface-id]")) return;
            clearFocus();
        };

        window.addEventListener("keydown", handleKeyDown, { signal });
        window.addEventListener("pointerdown", handlePointerDown, { signal });

        return () => controller.abort();
    }, [clearFocus]);

    const contextValue = useMemo<BlockFocusContextValue>(() => {
        return {
            state: {
                primaryFocusId,
                hoveredSurfaceId,
                selection,
                surfaces: surfacesRef.current,
                locks: locksRef.current,
            },
            registerSurface,
            updateSurface,
            focusSurface,
            setHoveredSurface: setHoveredSurfaceId,
            setSelection,
            toggleSelection,
            clearFocus,
            pushStackEntry,
            removeStackEntry,
            updateStackEntry,
            acquireLock,
            releaseLock,
            isInteractionLocked,
        };
    }, [
        primaryFocusId,
        hoveredSurfaceId,
        selection,
        registerSurface,
        updateSurface,
        focusSurface,
        setSelection,
        toggleSelection,
        clearFocus,
        pushStackEntry,
        removeStackEntry,
        updateStackEntry,
        acquireLock,
        releaseLock,
        isInteractionLocked,
        surfaceVersion,
        lockVersion,
    ]);

    return <BlockFocusContext.Provider value={contextValue}>{children}</BlockFocusContext.Provider>;
}

export function useBlockFocus() {
    const context = useContext(BlockFocusContext);
    if (!context) {
        throw new Error("useBlockFocus must be used within a BlockFocusProvider");
    }
    return context;
}
