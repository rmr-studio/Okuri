type SelectionType = "panel" | "block";

interface SelectionEntry {
    type: SelectionType;
    id: string;
    onDelete?: () => void;
}

type Listener = (selection: SelectionEntry | null) => void;

let stack: SelectionEntry[] = [];
const listeners = new Set<Listener>();

function notify() {
    const current = stack[stack.length - 1] ?? null;
    listeners.forEach((listener) => listener(current));
}

export function pushSelection(entry: SelectionEntry) {
    stack = stack.filter((item) => !(item.type === entry.type && item.id === entry.id));
    stack.push(entry);
    notify();
}

export function removeSelection(type: SelectionType, id: string) {
    const beforeLength = stack.length;
    stack = stack.filter((item) => !(item.type === type && item.id === id));
    if (stack.length !== beforeLength) {
        notify();
    }
}

export function updateSelection(entry: SelectionEntry) {
    const current = stack[stack.length - 1];
    if (current && current.type === entry.type && current.id === entry.id) {
        stack[stack.length - 1] = entry;
    }
}

export function clearSelection() {
    if (stack.length === 0) return;
    stack = [];
    notify();
}

export function subscribe(listener: Listener) {
    listeners.add(listener);
    listener(stack[stack.length - 1] ?? null);
    return () => listeners.delete(listener);
}

if (typeof window !== "undefined") {
    const controller = new AbortController();
    const { signal } = controller;
    window.addEventListener(
        "keydown",
        (event) => {
            if (event.key !== "Delete" && event.key !== "Backspace") return;
            const activeElement = document.activeElement as HTMLElement | null;
            if (activeElement) {
                const tag = activeElement.tagName;
                const isFormElement =
                    tag === "INPUT" || tag === "TEXTAREA" || activeElement.isContentEditable;
                if (isFormElement) return;
            }
            const current = stack[stack.length - 1];
            if (!current?.onDelete) return;
            event.preventDefault();
            current.onDelete();
        },
        { signal }
    );

    window.addEventListener(
        "pointerdown",
        (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;
            if (target.closest("[data-block-id]")) return;
            if (target.closest("[data-surface-id]")) return;
            clearSelection();
        },
        { signal }
    );

    // Cleanup for a dev environment
    if (import.meta && (import.meta as any).hot) {
        (import.meta as any).hot.dispose(() => controller.abort());
    }
}

export function getCurrentSelection(): SelectionEntry | null {
    return stack[stack.length - 1] ?? null;
}
