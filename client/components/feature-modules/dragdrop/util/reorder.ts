import { SortableItemProps } from "../blocks/sortable-wrapper";

/**
 * Reorder items in a list by moving `activeId` to the position of `overId`.
 *
 * @param items - array of items (must have `id`)
 * @param activeId - the item being dragged
 * @param overId - the item being dragged over
 */
export function reorder<T extends SortableItemProps>(
    items: T[],
    activeId: T["id"],
    overId: T["id"]
): T[] {
    const oldIndex = items.findIndex((item) => item.id === activeId);
    const newIndex = items.findIndex((item) => item.id === overId);

    if (oldIndex === -1 || newIndex === -1) return items;

    const updated = [...items];
    const [moved] = updated.splice(oldIndex, 1);
    updated.splice(newIndex, 0, moved);

    return updated;
}
