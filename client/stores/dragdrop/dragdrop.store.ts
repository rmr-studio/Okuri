import { create } from "zustand";

interface DragState {
    activeId: string | number | null;
    activeType: string | null;
    overId: string | number | null;

    setActive: (id: string | number, type: string) => void;
    setOver: (id: string | number | null) => void;
    reset: () => void;
}

/**
 * Global drag state store.
 * Keeps track of which item is being dragged and its target.
 */
export const useDragStore = create<DragState>((set) => ({
    activeId: null,
    activeType: null,
    overId: null,

    setActive: (id, type) => set({ activeId: id, activeType: type }),
    setOver: (id) => set({ overId: id }),
    reset: () => set({ activeId: null, activeType: null, overId: null }),
}));
