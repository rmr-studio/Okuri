import { useEffect, useRef } from "react";
import { useBlockFocus } from "../../../context/block-focus-provider";

export interface UsePanelOverlayLockOptions {
    id: string;
    isSlashOpen: boolean;
    isQuickOpen: boolean;
    isInlineMenuOpen: boolean;
    isDetailsOpen: boolean;
    isActionsOpen: boolean;
    drawerStateIsOpen: boolean;
    setFocusHover: (hover: boolean) => void;
}

/**
 * usePanelOverlayLock - Manage focus locks when menus/modals are open
 *
 * Purpose: Extracts ~50 lines of lock management logic from panel-wrapper.tsx (lines 241-285)
 *
 * Responsibilities:
 * 1. Determine lock state - should be active when ANY menu/modal is open
 * 2. Acquire/release lock - using BlockFocusProvider's acquireLock()
 * 3. Clear hover state - prevent race condition before acquiring lock
 *
 * Pattern: Follows block-edit-provider.tsx lines 100-124
 */
export function usePanelOverlayLock(options: UsePanelOverlayLockOptions): void {
    const {
        id,
        isSlashOpen,
        isQuickOpen,
        isInlineMenuOpen,
        isDetailsOpen,
        isActionsOpen,
        drawerStateIsOpen,
        setFocusHover,
    } = options;

    const { acquireLock } = useBlockFocus();
    const overlayLockRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Determine if lock should be active (any menu/modal is open)
        const shouldLock =
            isSlashOpen ||
            isQuickOpen ||
            isInlineMenuOpen ||
            isDetailsOpen ||
            isActionsOpen ||
            drawerStateIsOpen;

        // Acquire or release overlay lock based on menu state
        if (!shouldLock && overlayLockRef.current) {
            // Release lock
            overlayLockRef.current();
            overlayLockRef.current = null;
        } else if (shouldLock && !overlayLockRef.current) {
            // Clear hover state before acquiring lock to prevent race condition
            setFocusHover(false);

            // Acquire lock
            const release = acquireLock({
                id: `panel-overlay-${id}`,
                reason: "Panel overlay menu open",
                suppressHover: true,
                suppressSelection: true,
                suppressKeyboardNavigation: true, // Prevent block navigation when menus are open
                scope: "surface",
                surfaceId: id,
            });
            overlayLockRef.current = release;
        }
    }, [
        id,
        acquireLock,
        isInlineMenuOpen,
        isQuickOpen,
        isSlashOpen,
        isDetailsOpen,
        isActionsOpen,
        drawerStateIsOpen,
        setFocusHover,
    ]);

    // Cleanup on unmount only
    useEffect(() => {
        return () => {
            if (overlayLockRef.current) {
                overlayLockRef.current();
                overlayLockRef.current = null;
            }
        };
    }, []);
}
