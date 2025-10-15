import { ComponentType } from "@/components/feature-modules/blocks/interface/block.interface";
import React, { ComponentType as Component } from "react";
import { AddressCard } from "../components/AddressCard";
import { ContactCard } from "../components/ContactCard";
import { InlineOwnedList } from "../components/InlineOwnedList";

export const registry: Record<ComponentType, Component<any>> = {
    CONTACT_CARD: ContactCard,
    ADDRESS_CARD: AddressCard, // not used directly in this demo
    LINE_ITEM: InlineOwnedList, // treat LINE_ITEM as our inline list container
    TABLE: (p: any) => (
        <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(p, null, 2)}</pre>
    ),
    TEXT: (p: any) => <div>{p.text ?? ""}</div>,
    IMAGE: (p: any) => <img src={p.src} alt={p.alt ?? ""} />,
    BUTTON: (p: any) => <button>{p.label ?? "Button"}</button>,
    ATTACHMENT: (p: any) => <div className="border rounded p-3">{p.children}</div>,
};

export const FallbackComponent: React.FC<{ reason?: string }> = ({ reason }) => (
    <div className="rounded border p-3 text-sm opacity-70">
        Unsupported component{reason ? `: ${reason}` : ""}
    </div>
);
