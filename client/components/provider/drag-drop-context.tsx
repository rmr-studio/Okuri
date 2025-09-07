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
    strategy: CollisionDetection;
    handleDragStart?: (event: DragStartEvent) => void;
    handleDragOver?: (event: DragOverEvent) => void;
    handleDragEnd?: (event: DragEndEvent) => void;
}

export const DragDropProvider: FCWC<Props> = ({ children, strategy = closestCenter }) => {
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

    const handleDragStart = (event: DragStartEvent) => {
        console.log("Drag started:", event);
    };

    const handleDragOver = (event: DragOverEvent) => {
        console.log("Drag over:", event);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        console.log("Drag ended:", event);
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
