"use client";

import { ClientCreation } from "./client-form";

interface ClientPreviewProps {
    data: ClientCreation;
}
//todo: Fully functional client preview that will mimic the client overview page and will dynamically update

export function ClientPreview({ data }: ClientPreviewProps) {
    return (
        <>
            <h2 className="text-lg font-semibold">Client Preview</h2>

            <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                    Basic Information
                </h3>
                <div className="space-y-2">
                    <div>
                        <span className="text-sm font-medium">Name:</span>
                        <p className="text-sm text-muted-foreground">
                            {data.name || "Not specified"}
                        </p>
                    </div>
                    {data.contact?.email && (
                        <div>
                            <span className="text-sm font-medium">Email:</span>
                            <p className="text-sm text-muted-foreground">{data.contact.email}</p>
                        </div>
                    )}
                    {data.contact?.phone && (
                        <div>
                            <span className="text-sm font-medium">Phone:</span>
                            <p className="text-sm text-muted-foreground">{data.contact.phone}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
