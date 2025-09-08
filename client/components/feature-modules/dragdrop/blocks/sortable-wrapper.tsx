import { FCWC } from "@/lib/interfaces/interface";
import {
    rectSortingStrategy,
    SortableContext,
    SortingStrategy,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export interface SortableItemProps {
    id: string | number;
}

interface SortableWrapperProps {
    items: SortableItemProps[];
}

interface GenericSortableWrapperProps extends SortableWrapperProps {
    strategy?: SortingStrategy;
}

export const SortableWrapper: FCWC<GenericSortableWrapperProps> = ({
    items,
    strategy,
    children,
}) => {
    return (
        <SortableContext items={items} strategy={strategy}>
            {children}
        </SortableContext>
    );
};

export const SortableList: FCWC<SortableWrapperProps> = ({ children, items }) => {
    return (
        <SortableWrapper items={items} strategy={verticalListSortingStrategy}>
            {children}
        </SortableWrapper>
    );
};

export const SortableBoard: FCWC<SortableWrapperProps> = ({ children, items }) => {
    return (
        <SortableWrapper items={items} strategy={rectSortingStrategy}>
            {children}
        </SortableWrapper>
    );
};
