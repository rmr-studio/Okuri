"use client";

import { GridStackOptions, GridStackWidget } from "gridstack";
import { useEffect, useState } from "react";

import "gridstack/dist/gridstack.css";
import { GridContainerProvider } from "../provider/grid-container-provider";
import { GridProvider, useGrid } from "../provider/grid-provider";
import { WidgetRenderProvider } from "../provider/grid-widget-provider";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WIDGETS } from "../util/registry";

const CELL_HEIGHT = 50;
const BREAKPOINTS = [
    { c: 1, w: 700 },
    { c: 3, w: 850 },
    { c: 6, w: 950 },
    { c: 8, w: 1100 },
];

// Content must match your widget schema structure
const gridOptions: GridStackOptions = {
    acceptWidgets: true,
    columnOpts: {
        breakpointForWindow: true,
        breakpoints: BREAKPOINTS,
        layout: "moveScale",
        columnMax: 12,
    },
    margin: 8,
    cellHeight: CELL_HEIGHT,
    subGridOpts: {
        acceptWidgets: true,
        subGridDynamic: true,
        columnOpts: {
            breakpoints: BREAKPOINTS,
            layout: "moveScale",
        },
        margin: 8,
        minRow: 2,
        cellHeight: CELL_HEIGHT,
    },
    children: [
        {
            id: "item1",
            h: 2,
            w: 2,
            x: 0,
            y: 0,
            content: JSON.stringify({
                id: "item1",
                type: "TEXT",
                data: {
                    content: "Item 2",
                    variant: "input",
                    style: {
                        size: 16,
                        color: "#000000",
                        horizontalAlign: "center",
                        verticalAlign: "center",
                    },
                    validation: {
                        required: false,
                    },
                },
                position: {
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 2,
                },
                interactions: {
                    draggable: true,
                    resizable: true,
                    deletable: true,
                },
            }),
        },
        {
            id: "item2",
            h: 2,
            w: 2,
            x: 2,
            y: 0,
            content: JSON.stringify({
                id: "item2",
                type: "TEXT",
                data: {
                    content: "Item 2",
                    variant: "input",
                    style: {
                        size: 14,
                        color: "#333333",
                    },
                },
                position: {
                    x: 2,
                    y: 0,
                    width: 2,
                    height: 2,
                },
                interactions: {},
            }),
        },
        {
            id: "sub-grid-1",
            h: 5,
            sizeToContent: true,
            subGridOpts: {
                acceptWidgets: true,
                cellHeight: CELL_HEIGHT,
                subGridDynamic: true,
                column: "auto",
                minRow: 2,
                layout: "list",
                margin: 8,
                children: [
                    {
                        id: "sub-grid-1-title",
                        locked: true,
                        noMove: true,
                        noResize: true,
                        w: 12,
                        x: 0,
                        y: 0,
                        content: JSON.stringify({
                            id: "sub-grid-1-title",
                            type: "TEXT",
                            data: {
                                content: "Sub Grid 1 Title",
                                variant: "input",
                                style: {
                                    size: 18,
                                    weight: "bold",
                                    color: "#000000",
                                },
                            },
                            position: {
                                x: 0,
                                y: 0,
                                width: 12,
                                height: 1,
                            },
                            interactions: {
                                draggable: false,
                                resizable: false,
                                deletable: false,
                            },
                        }),
                    },
                    {
                        id: "item3",
                        h: 2,
                        w: 2,
                        x: 0,
                        y: 1,
                        content: JSON.stringify({
                            id: "item3",
                            type: "TEXT",
                            data: {
                                content: "Item 3",
                            },
                            position: {
                                x: 0,
                                y: 1,
                                width: 2,
                                height: 2,
                            },
                            interactions: {},
                        }),
                    },
                    {
                        id: "item4",
                        h: 2,
                        w: 2,
                        x: 2,
                        y: 0,
                        content: JSON.stringify({
                            id: "item4",
                            type: "TEXT",
                            data: {
                                content: "Item 4",
                            },
                            position: {
                                x: 2,
                                y: 0,
                                width: 2,
                                height: 2,
                            },
                            interactions: {},
                        }),
                    },
                ],
            },
            w: 12,
            x: 0,
            y: 2,
        },
    ],
};

/**
 * Demo page that mounts a GridStack-powered editor with toolbar, widget area, and debug panel.
 *
 * Initializes the grid with the file-level `gridOptions` and provides that to the GridProvider.
 * Renders the Toolbar (controls to add widgets/sub-grids), the GridContainer with the registered
 * widget renderer mapping, and a DebugInfo panel that shows initial and live grid options.
 *
 * @returns The demo React element.
 */
export function GridStackDemo() {
    const [initialOptions] = useState(gridOptions);

    return (
        <GridProvider initialOptions={initialOptions}>
            <Toolbar />
            <GridContainerProvider>
                <WidgetRenderProvider componentMap={WIDGETS} />
            </GridContainerProvider>
            <DebugInfo />
        </GridProvider>
    );
}

/**
 * Toolbar with actions to add widgets to the current grid.
 *
 * Renders buttons that call the grid context's addWidget and addSubGrid callbacks using
 * the proper widget schema structure.
 */
function Toolbar() {
    const { addWidget, addSubGrid } = useGrid();

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>Toolbar</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 flex-wrap">
                <Button
                    variant="default"
                    onClick={() => {
                        addWidget((id) => ({
                            w: 2,
                            h: 2,
                            x: 0,
                            y: 0,
                            content: JSON.stringify({
                                id,
                                type: "TEXT",
                                data: {
                                    content: `Dynamic Text ${id}`,
                                    variant: "input",
                                    style: {
                                        size: 16,
                                        color: "#000000",
                                    },
                                },
                                position: {
                                    x: 0,
                                    y: 0,
                                    width: 2,
                                    height: 2,
                                },
                                interactions: {
                                    draggable: true,
                                    resizable: true,
                                    deletable: true,
                                },
                            }),
                        }));
                    }}
                >
                    Add Text Widget (2x2)
                </Button>

                <Button
                    variant="outline"
                    onClick={() => {
                        addWidget((id) => ({
                            w: 3,
                            h: 3,
                            x: 0,
                            y: 0,
                            content: JSON.stringify({
                                id,
                                type: "MEDIA",
                                data: {
                                    // Add MEDIA widget specific data here based on your MediaWidget schema
                                    src: "https://via.placeholder.com/300x200",
                                    alt: `Media ${id}`,
                                },
                                position: {
                                    x: 0,
                                    y: 0,
                                    width: 3,
                                    height: 3,
                                },
                                interactions: {},
                            }),
                        }));
                    }}
                >
                    Add Media Widget (3x3)
                </Button>

                <Button
                    variant="outline"
                    onClick={() => {
                        addWidget((id) => ({
                            w: 4,
                            h: 3,
                            x: 0,
                            y: 0,
                            content: JSON.stringify({
                                id,
                                type: "CHART",
                                data: {
                                    // Add CHART widget specific data here based on your ChartWidget schema
                                    title: `Chart ${id}`,
                                    type: "bar",
                                },
                                position: {
                                    x: 0,
                                    y: 0,
                                    width: 4,
                                    height: 3,
                                },
                                interactions: {},
                            }),
                        }));
                    }}
                >
                    Add Chart Widget (4x3)
                </Button>

                <Button
                    variant="secondary"
                    onClick={() => {
                        addSubGrid((id, withWidget) => ({
                            h: 5,
                            noResize: false,
                            sizeToContent: true,
                            subGridOpts: {
                                class: "border",
                                acceptWidgets: true,
                                columnOpts: {
                                    breakpoints: BREAKPOINTS,
                                    layout: "moveScale",
                                },
                                margin: 8,
                                minRow: 2,
                                cellHeight: CELL_HEIGHT,
                                children: [
                                    withWidget({
                                        h: 1,
                                        locked: true,
                                        noMove: true,
                                        noResize: true,
                                        w: 12,
                                        x: 0,
                                        y: 0,
                                        content: JSON.stringify({
                                            id: `${id}-title`,
                                            type: "TEXT",
                                            data: {
                                                content: `Sub Grid Title ${id}`,
                                                variant: "input",
                                                style: {
                                                    size: 18,
                                                    weight: "bold",
                                                    horizontalAlign: "center",
                                                },
                                            },
                                            position: {
                                                x: 0,
                                                y: 0,
                                                width: 12,
                                                height: 1,
                                            },
                                            interactions: {
                                                deletable: false,
                                            },
                                        }),
                                    }),
                                ],
                            },
                            w: 12,
                            x: 0,
                            y: 0,
                        }));
                    }}
                >
                    Add Sub Grid (12x1)
                </Button>
            </CardContent>
        </Card>
    );
}

/**
 * Renders a debug panel that shows the initial grid options and a live snapshot of the grid state.
 *
 * The component reads `initialOptions` and `saveOptions` from `useGrid()`. It polls `saveOptions()` every
 * 2 seconds (if available) to update a realtime snapshot shown alongside the immutable initial options.
 * The polling interval is cleaned up on unmount.
 *
 * @remarks
 * Useful for inspecting the configured GridStack options and the current saved widget/layout data while interacting with the demo.
 */
function DebugInfo() {
    const { initialOptions, saveOptions } = useGrid();

    const [realtimeOptions, setRealtimeOptions] = useState<
        GridStackOptions | GridStackWidget[] | undefined
    >(undefined);

    useEffect(() => {
        const timer = setInterval(() => {
            if (saveOptions) {
                const data = saveOptions();
                setRealtimeOptions(data);
            }
        }, 2000);

        return () => clearInterval(timer);
    }, [saveOptions]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Debug Info</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h3 className="font-semibold mb-2">Initial Options</h3>
                    <pre className="bg-muted text-muted-foreground p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(initialOptions, null, 2)}
                    </pre>
                </div>
                <div>
                    <h3 className="font-semibold mb-2">Realtime Options (2s refresh)</h3>
                    <pre className="bg-muted text-muted-foreground p-4 rounded-lg overflow-auto text-sm">
                        {JSON.stringify(realtimeOptions, null, 2)}
                    </pre>
                </div>
            </CardContent>
        </Card>
    );
}
