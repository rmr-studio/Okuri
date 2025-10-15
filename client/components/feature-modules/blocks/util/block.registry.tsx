import { ComponentType } from "@/components/feature-modules/blocks/interface/block.interface";
import React, { ComponentType as Component } from "react";
import { AddressCard } from "../components/AddressCard";
import { BlockButton } from "../components/BlockButton";
import { ContactCard } from "../components/ContactCard";
import { DataSummaryTable } from "../components/DataSummaryTable";
import { InlineOwnedList } from "../components/InlineOwnedList";
import { TextBlock } from "../components/TextBlock";

export const registry: Record<ComponentType, Component<any>> = {
    CONTACT_CARD: ContactCard,
    ADDRESS_CARD: AddressCard,
    LINE_ITEM: InlineOwnedList,
    TABLE: DataSummaryTable,
    TEXT: TextBlock,
    IMAGE: (p: any) => (
        <img
            src={p.src}
            alt={p.alt ?? ""}
            className={p.className ?? "rounded-md object-cover max-h-64 w-full"}
        />
    ),
    BUTTON: BlockButton,
    ATTACHMENT: (p: any) => (
        <div className="rounded border border-dashed p-3 text-sm text-muted-foreground">
            {p.children ?? "Attachment placeholder"}
        </div>
    ),
};

export const FallbackComponent: React.FC<{ reason?: string }> = ({ reason }) => (
    <div className="rounded border p-3 text-sm opacity-70">
        Unsupported component{reason ? `: ${reason}` : ""}
    </div>
);
