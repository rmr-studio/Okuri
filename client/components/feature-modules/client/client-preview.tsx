"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientCreation } from "./form/client-form";

interface ClientPreviewProps {
    data: ClientCreation;
}

export function ClientPreview({ data }: ClientPreviewProps) {
    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Client Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        {data.contactDetails?.email && (
                            <div>
                                <span className="text-sm font-medium">Email:</span>
                                <p className="text-sm text-muted-foreground">
                                    {data.contactDetails.email}
                                </p>
                            </div>
                        )}
                        {data.contactDetails?.phone && (
                            <div>
                                <span className="text-sm font-medium">Phone:</span>
                                <p className="text-sm text-muted-foreground">
                                    {data.contactDetails.phone}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {data.attributes && Object.keys(data.attributes).length > 0 && (
                    <div>
                        <h3 className="font-medium text-sm text-muted-foreground mb-2">
                            Custom Attributes
                        </h3>
                        <div className="space-y-2">
                            {Object.entries(data.attributes).map(([key, value]) => (
                                <div key={key}>
                                    <span className="text-sm font-medium capitalize">
                                        {key.replace(/([A-Z])/g, " $1")}:
                                    </span>
                                    <div className="mt-1">
                                        {Array.isArray(value) ? (
                                            <div className="flex flex-wrap gap-1">
                                                {value.map((item, index) => (
                                                    <Badge
                                                        key={index}
                                                        variant="secondary"
                                                        className="text-xs"
                                                    >
                                                        {item}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : typeof value === "boolean" ? (
                                            <Badge
                                                variant={value ? "default" : "secondary"}
                                                className="text-xs"
                                            >
                                                {value ? "Yes" : "No"}
                                            </Badge>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                {value ?? "Not specified"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
