"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
} from "@dnd-kit/core";
import { nanoid } from "nanoid";
import { useCallback, useMemo, useState } from "react";

import { GridBlock } from "../blocks/grid-block";
import { SortableList } from "../blocks/sortable-wrapper";
import { createBlockTreeManager } from "../util/block-operations";
import { smartCollisionDetection } from "../util/collision";
import {
    createErrorHandler,
    createValidator,
    DragDropError,
} from "../util/error-handling";
import { DragRegistry, getDefaultBlockData } from "../util/registry";
import { GridBlockProps } from "../util/types";

/**
 * ComprehensiveExample - Full-featured drag and drop grid builder
 *
 * This example demonstrates:
 * - Multiple block types
 * - Drag and drop with validation
 * - Resizing with size persistence
 * - Error handling and logging
 * - Drag overlays
 * - Block tree operations
 * - Real-time validation
 */

export const ComprehensiveExample = () => {
    const [blocks, setBlocks] = useState<GridBlockProps[]>([
        {
            id: "welcome",
            type: "displayBlock",
            data: { title: "Welcome Block" },
        },
        {
            id: "widget1",
            type: "dashboardWidget",
            data: {
                title: "Analytics Widget",
                description: "Shows key metrics",
            },
        },
        {
            id: "container1",
            type: "containerBlock",
            children: [
                {
                    id: "nested1",
                    type: "displayBlock",
                    data: { title: "Nested Block 1" },
                },
                {
                    id: "nested2",
                    type: "displayBlock",
                    data: { title: "Nested Block 2" },
                },
            ],
            sizes: [60, 40],
        },
    ]);

    const [activeId, setActiveId] = useState<string | number | null>(null);
    const [errors, setErrors] = useState<DragDropError[]>([]);

    // Create managers
    const [blockManager] = useState(() => createBlockTreeManager(blocks));
    const [errorHandler] = useState(() =>
        createErrorHandler((error) => {
            setErrors((prev) => [...prev, error]);
        })
    );
    const [validator] = useState(() => createValidator(errorHandler));

    // Update manager when blocks change
    blockManager.setBlocks(blocks);

    // Validate blocks
    const validationResult = useMemo(() => {
        errorHandler.clearErrors();
        const isValid = validator.validateBlockTree(blocks);
        return { isValid, errors: errorHandler.getErrors() };
    }, [blocks, errorHandler, validator]);

    const handleAddBlock = useCallback((type: string) => {
        const newBlock: GridBlockProps = {
            id: nanoid(8),
            type,
            data: getDefaultBlockData(type),
            children: type.includes("container") ? [] : undefined,
        };
        setBlocks((prev) => [...prev, newBlock]);
    }, []);

    const handleResize = useCallback(
        (blockId: string | number, sizes: number[]) => {
            const updatedBlocks = blockManager.resizeBlock(blockId, sizes);
            setBlocks(updatedBlocks);
        },
        [blockManager]
    );

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveId(event.active.id);
    }, []);

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;
            setActiveId(null);

            if (!over || active.id === over.id) return;

            const result = blockManager.handleDragDrop(active.id, over.id);

            if (result.success) {
                setBlocks(result.blocks);
            } else {
                console.warn("Drag drop failed:", result.error);
            }
        },
        [blockManager]
    );

    const handleDragCancel = useCallback(() => {
        setActiveId(null);
    }, []);

    const renderDragOverlay = useCallback(() => {
        if (!activeId) return null;

        const block = blockManager.findBlock(activeId).block;
        if (!block) return null;

        const config = DragRegistry[block.type];
        if (!config?.renderOverlay) return null;

        return config.renderOverlay(block.id, block.data);
    }, [activeId, blockManager]);

    const handleClearErrors = useCallback(() => {
        setErrors([]);
        errorHandler.clearErrors();
    }, [errorHandler]);

    const handleRemoveBlock = useCallback(
        (blockId: string | number) => {
            const updatedBlocks = blockManager.removeBlock(blockId);
            setBlocks(updatedBlocks);
        },
        [blockManager]
    );

    const blockTypes = Object.keys(DragRegistry);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        Drag & Drop Grid Builder
                    </h1>
                    <p className="text-muted-foreground">
                        Comprehensive example with validation, error handling,
                        and multiple block types
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant={
                            validationResult.isValid ? "default" : "destructive"
                        }
                    >
                        {validationResult.isValid ? "Valid" : "Invalid"}
                    </Badge>
                    {errors.length > 0 && (
                        <Badge variant="secondary">
                            {errors.length} Error
                            {errors.length !== 1 ? "s" : ""}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Controls */}
            <Card>
                <CardHeader>
                    <CardTitle>Add Blocks</CardTitle>
                    <CardDescription>
                        Click to add different types of blocks to the grid
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                        {blockTypes.map((type) => (
                            <Button
                                key={type}
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddBlock(type)}
                            >
                                Add {DragRegistry[type].label}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Error Display */}
            {errors.length > 0 && (
                <Card className="border-destructive">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-destructive">
                                Errors
                            </CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleClearErrors}
                            >
                                Clear
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {errors.map((error, index) => (
                                <div
                                    key={index}
                                    className="p-2 bg-destructive/10 rounded text-sm"
                                >
                                    <div className="font-medium">
                                        {error.type}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {error.message}
                                    </div>
                                    {error.details && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {JSON.stringify(
                                                error.details,
                                                null,
                                                2
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Grid */}
            <Card>
                <CardHeader>
                    <CardTitle>Grid Builder</CardTitle>
                    <CardDescription>
                        Drag blocks onto others to create nested containers.
                        Resize using handles. Right-click blocks to remove them.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DndContext
                        collisionDetection={smartCollisionDetection}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    >
                        <SortableList items={blocks}>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {blocks.map((block) => (
                                    <div
                                        key={block.id}
                                        className="relative group"
                                    >
                                        <GridBlock
                                            id={block.id}
                                            type={block.type}
                                            children={block.children}
                                            sizes={block.sizes}
                                            onResize={handleResize}
                                            data={block.data}
                                            className="min-h-[200px]"
                                        />
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() =>
                                                handleRemoveBlock(block.id)
                                            }
                                        >
                                            ×
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </SortableList>

                        <DragOverlay>{renderDragOverlay()}</DragOverlay>
                    </DndContext>
                </CardContent>
            </Card>

            {/* Debug Info */}
            <Card>
                <CardHeader>
                    <CardTitle>Debug Information</CardTitle>
                    <CardDescription>
                        Current block tree structure and statistics
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="font-medium mb-2">Block Count</h4>
                            <p className="text-sm text-muted-foreground">
                                Total blocks: {blocks.length}
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium mb-2">Block Types</h4>
                            <div className="flex flex-wrap gap-1">
                                {Object.entries(
                                    blocks.reduce((acc, block) => {
                                        acc[block.type] =
                                            (acc[block.type] || 0) + 1;
                                        return acc;
                                    }, {} as Record<string, number>)
                                ).map(([type, count]) => (
                                    <Badge key={type} variant="secondary">
                                        {type}: {count}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
