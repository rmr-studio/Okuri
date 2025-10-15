import React from "react";
import { AddressCard } from "./AddressCard";

/**
 * Renders OWNED child block refs inline.
 * Expects props.items = RefRow[] where each row.entity.payload.data is the child block's data.
 */
export const InlineOwnedList: React.FC<{ items?: any[]; itemComponent?: string }> = ({
    items,
    itemComponent,
}) => {
    if (!items || items.length === 0) return <div className="text-sm opacity-70">No items</div>;
    return (
        <div className="grid gap-3">
            {items.map((r: any) => {
                const data = r?.entity?.payload?.data ?? {};
                // MVP: only ADDRESS_CARD demo
                if (itemComponent === "ADDRESS_CARD") {
                    return <AddressCard key={r.entityId} address={data} />;
                }
                return (
                    <pre key={r.entityId} className="text-xs bg-gray-50 p-2 rounded">
                        {JSON.stringify(data, null, 2)}
                    </pre>
                );
            })}
        </div>
    );
};
