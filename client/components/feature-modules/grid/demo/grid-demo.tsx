"use client";

import { GridStackOptions, GridStackWidget } from "gridstack";
import { ComponentProps, useEffect, useState } from "react";

import "gridstack/dist/gridstack.css";
import { GridContainerProvider } from "../provider/grid-container-provider";
import { GridProvider, useGrid } from "../provider/grid-provider";
import { ComponentDataType, WidgetRenderProvider } from "../provider/grid-widget-provider";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextWidget } from "../item/text-item";
import { WIDGETS } from "../util/registry";

const CELL_HEIGHT = 50;
const BREAKPOINTS = [
    { c: 1, w: 700 },
    { c: 3, w: 850 },
    { c: 6, w: 950 },
    { c: 8, w: 1100 },
];

// ! Content must be json string like this:
// { name: "Text", props: { content: "Item 1" } }
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
                name: "TEXT",
                props: { content: "Item 1" },
            } satisfies ComponentDataType<ComponentProps<typeof TextWidget>>),
        },
        {
            id: "item2",
            h: 2,
            w: 2,
            x: 2,
            y: 0,
            content: JSON.stringify({
                name: "TEXT",
                props: { content: "Item 2" },
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
                            name: "TEXT",
                            props: { content: "Sub Grid 1 Title" },
                        }),
                    },
                    {
                        id: "item3",
                        h: 2,
                        w: 2,
                        x: 0,
                        y: 1,
                        content: JSON.stringify({
                            name: "TEXT",
                            props: { content: "Item 3" },
                        }),
                    },
                    {
                        id: "item4",
                        h: 2,
                        w: 2,
                        x: 2,
                        y: 0,
                        content: JSON.stringify({
                            name: "TEXT",
                            props: { content: "Item 4" },
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
 * Renders two buttons that call the grid context's addWidget and addSubGrid callbacks:
 * - "Add Text (2x2)": inserts a 2x2 TEXT widget whose `content` payload contains the generated widget id.
 * - "Add Sub Grid (12x1)": inserts a 12-wide sub-grid (height 5, sizeToContent) whose sub-grid options include a locked full-width title child.
 */
function Toolbar() {
    const { addWidget, addSubGrid } = useGrid();

    return (
        <Card className="mb-4">
            <CardHeader>
                <CardTitle>Toolbar</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
                <Button
                    variant="default"
                    onClick={() => {
                        addWidget((id) => ({
                            w: 2,
                            h: 2,
                            x: 0,
                            y: 0,
                            content: JSON.stringify({
                                name: "TEXT",
                                props: { content: id },
                            }),
                        }));
                    }}
                >
                    Add Text (2x2)
                </Button>

                <Button
                    variant="secondary"
                    onClick={() => {
                        addSubGrid((id, withWidget) => ({
                            h: 5,
                            noResize: false,
                            sizeToContent: true,
                            subGridOpts: {
                                acceptWidgets: true,
                                columnOpts: { breakpoints: BREAKPOINTS, layout: "moveScale" },
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
                                            name: "TEXT",
                                            props: { content: "Sub Grid 1 Title" + id },
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
