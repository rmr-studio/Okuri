import { useEffect } from "react";

/**
 * Hook that sets up keyboard shortcuts for layout operations.
 * Currently only handles Ctrl/Cmd+S to trigger "Save All".
 *
 * @param onSave - Optional callback for save shortcut (Ctrl+S)
 */
export const useLayoutKeyboardShortcuts = (onSave?: () => void | Promise<void>) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Ctrl/Cmd modifier
            const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
            const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

            // Ignore if typing in input/textarea/contenteditable
            const target = e.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return;
            }

            // Ctrl+S or Cmd+S - Save (if callback provided)
            if (ctrlKey && e.key === "s" && onSave) {
                e.preventDefault();
                onSave();
                console.log("⌨️ [KEYBOARD] Save triggered");
                return;
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [onSave]);
};
