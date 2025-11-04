export type ResizePosition = "nw" | "ne" | "sw" | "se";

export interface SlashMenuItem {
    id: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    onSelect?: () => void;
}

export interface QuickActionItem {
    id: string;
    label: string;
    // Takes in block id
    onSelect: (id: string) => void;
    shortcut?: string;
    description?: string;
}
