"use client";

import { FCWC } from "@/lib/interfaces/interface";
import {
    closestCenter,
    CollisionDetection,
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragStartEvent,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";

interface Props {
    strategy?: CollisionDetection;
    handleDragStart?: (event: DragStartEvent) => void;
    handleDragOver?: (event: DragOverEvent) => void;
    handleDragEnd?: (event: DragEndEvent) => void;
}

export const DragDropProvider: FCWC<Props> = ({
    children,
    strategy = closestCenter,
    handleDragEnd,
    handleDragOver,
    handleDragStart,
}) => {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

    const onDragStart = (event: DragStartEvent) => {
        if (process.env.NODE_ENV === "development") {
            console.log("Drag started:", event);
        }
        handleDragStart?.(event);
    };

    const onDragOver = (event: DragOverEvent) => {
        if (process.env.NODE_ENV === "development") {
            console.log("Drag over:", event);
        }
        handleDragOver?.(event);
    };

    const onDragEnd = (event: DragEndEvent) => {
        if (process.env.NODE_ENV === "development") {
            console.log("Drag ended:", event);
        }
        handleDragEnd?.(event);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={strategy}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            {children}
        </DndContext>
    );
};
