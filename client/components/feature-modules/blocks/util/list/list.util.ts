/**
 * Utility functions for detecting and working with content block lists
 */

import {
    BlockListConfiguration,
    BlockNode,
    ContentNode,
    isContentMetadata,
    isContentNode,
    isEntityReferenceMetadata,
    isReferenceNode,
} from "../../interface/block.interface";

/**
 * A list will be rendered if:
 * - It is a reference node to an entity reference
 * - It is a content node with a list configuration
 *
 * @param node
 * @returns
 */
export const isList = (node: ContentNode): Boolean => {
    return (
        (isReferenceNode(node) && isEntityReferenceMetadata(node.block.payload)) ||
        (isContentNode(node) &&
            isContentMetadata(node.block.payload) &&
            !!node.block.payload.listConfig)
    );
};

/**
 * Checks if a list is in manual ordering mode
 */
export function isManualOrderingMode(listConfig: BlockListConfiguration): boolean {
    return listConfig.order.mode === "MANUAL";
}

/**
 * Checks if a list is in sorted ordering mode
 */
export function isSortedOrderingMode(listConfig: BlockListConfiguration): boolean {
    return listConfig.order.mode === "SORTED";
}

/**
 * Gets the index of a child block within its parent's children array
 */
export function getChildIndexInList(parentNode: BlockNode, childId: string): number {
    if (!isContentNode(parentNode) || !parentNode.children) return -1;
    return parentNode.children.findIndex((child) => child.block.id === childId);
}

/**
 * Checks if a block can move up in a list (not at index 0)
 */
export function canMoveUp(parentNode: BlockNode, childId: string): boolean {
    return getChildIndexInList(parentNode, childId) > 0;
}

/**
 * Checks if a block can move down in a list (not at last index)
 */
export function canMoveDown(parentNode: BlockNode, childId: string): boolean {
    if (!isContentNode(parentNode) || !parentNode.children) return false;
    const index = getChildIndexInList(parentNode, childId);
    return index !== -1 && index < parentNode.children.length - 1;
}
