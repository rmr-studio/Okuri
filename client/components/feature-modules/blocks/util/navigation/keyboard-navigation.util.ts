import { GridStackNode } from "gridstack";
import { BlockNode, isContentNode } from "../../interface/block.interface";

/**
 * Utility functions for keyboard navigation through the block tree.
 * Provides depth-first tree traversal and spatial navigation helpers.
 */

interface NavigationContext {
    getBlock: (id: string) => BlockNode | undefined;
    getParentId: (id: string) => string | null;
    getChildren: (id: string) => string[];
    getTrees: () => any[];
    findWidget: (id: string) => { success: boolean; node: GridStackNode | null };
}

/**
 * Get all root block IDs (top-level blocks in the environment)
 */
export const getRootBlockIds = (context: NavigationContext): string[] => {
    const trees = context.getTrees();
    return trees.map((tree) => tree.root.block.id);
};

/**
 * Get the first focusable block in the entire tree (first root)
 */
export const getFirstBlock = (context: NavigationContext): string | null => {
    const roots = getRootBlockIds(context);
    if (roots.length === 0) return null;

    // Return the first root block itself
    // The logic to enter its children is handled by getNextInTree when navigating forward
    return roots[0];
};

/**
 * Get the last focusable block in the entire tree (last root)
 */
export const getLastBlock = (context: NavigationContext): string | null => {
    const roots = getRootBlockIds(context);
    if (roots.length === 0) return null;

    // Return the last root block itself
    // The logic to enter its children is handled by getPreviousInTree when navigating backward
    return roots[roots.length - 1];
};

/**
 * Navigate forward in depth-first order (Tab / Arrow Down behavior)
 *
 * Algorithm:
 * 1. If current has children → return first child
 * 2. Else if current has next sibling → return next sibling
 * 3. Else walk up ancestors until we find one with next sibling → return that
 * 4. If we reach top → wrap to first block
 */
export const getNextInTree = (currentId: string, context: NavigationContext): string | null => {
    // 1. Try to go into children first
    const children = context.getChildren(currentId);
    if (children.length > 0) {
        return children[0];
    }

    // 2. Try to go to next sibling
    const nextSibling = getNextSibling(currentId, context);
    if (nextSibling) {
        return nextSibling;
    }

    // 3. Walk up the tree to find an ancestor with a next sibling
    let ancestorId = context.getParentId(currentId);
    while (ancestorId) {
        const ancestorNextSibling = getNextSibling(ancestorId, context);
        if (ancestorNextSibling) {
            return ancestorNextSibling;
        }
        ancestorId = context.getParentId(ancestorId);
    }

    // 4. We've reached the end - wrap to first block
    return getFirstBlock(context);
};

/**
 * Navigate backward in depth-first order (Shift+Tab / Arrow Up behavior)
 *
 * Algorithm:
 * 1. If current has previous sibling → return last descendant of that sibling
 * 2. Else return parent
 * 3. If at root → wrap to last block
 */
export const getPreviousInTree = (currentId: string, context: NavigationContext): string | null => {
    const previousSibling = getPreviousSibling(currentId, context);

    if (previousSibling) {
        // Go to the last descendant of the previous sibling
        return getLastDescendant(previousSibling, context);
    }

    // Go to parent
    const parentId = context.getParentId(currentId);
    if (parentId) {
        return parentId;
    }

    // We're at a root with no previous sibling - wrap to last block
    return getLastBlock(context);
};

/**
 * Get the next sibling of a block (same parent, next in order)
 */
export const getNextSibling = (blockId: string, context: NavigationContext): string | null => {
    const parentId = context.getParentId(blockId);

    // If no parent, check if this is a root and get next root
    if (!parentId) {
        const roots = getRootBlockIds(context);
        const currentIndex = roots.indexOf(blockId);
        if (currentIndex === -1) return null;
        if (currentIndex === roots.length - 1) return null; // Last root
        return roots[currentIndex + 1];
    }

    const siblings = context.getChildren(parentId);
    const currentIndex = siblings.indexOf(blockId);

    if (currentIndex === -1) return null;
    if (currentIndex === siblings.length - 1) return null; // Last sibling

    return siblings[currentIndex + 1];
};

/**
 * Get the previous sibling of a block (same parent, previous in order)
 */
export const getPreviousSibling = (blockId: string, context: NavigationContext): string | null => {
    const parentId = context.getParentId(blockId);

    // If no parent, check if this is a root and get previous root
    if (!parentId) {
        const roots = getRootBlockIds(context);
        const currentIndex = roots.indexOf(blockId);
        if (currentIndex <= 0) return null;
        return roots[currentIndex - 1];
    }

    const siblings = context.getChildren(parentId);
    const currentIndex = siblings.indexOf(blockId);

    if (currentIndex <= 0) return null;

    return siblings[currentIndex - 1];
};

/**
 * Get the last descendant of a block (walk down to the deepest last child)
 */
export const getLastDescendant = (blockId: string, context: NavigationContext): string => {
    let current = blockId;

    while (true) {
        const children = context.getChildren(current);
        if (children.length === 0) break;
        current = children[children.length - 1];
    }

    return current;
};

/**
 * Check if a block is inside a list container
 */
export const isBlockInList = (blockId: string, context: NavigationContext): boolean => {
    const parentId = context.getParentId(blockId);
    if (!parentId) return false;

    const parent = context.getBlock(parentId);
    if (!parent) return false;

    // Check if parent is a list type
    return isContentNode(parent) && parent.block.payload?.type === "content" && !!parent.block.payload?.listConfig;
};

/**
 * Find the closest block to the left (same row, lower x value)
 */
export const getBlockToLeft = (currentId: string, context: NavigationContext): string | null => {
    // Skip if in a list
    if (isBlockInList(currentId, context)) return null;

    const currentWidget = context.findWidget(currentId);
    if (!currentWidget.success || !currentWidget.node) return null;

    const currentX = currentWidget.node.x ?? 0;
    const currentY = currentWidget.node.y ?? 0;

    // Get all siblings
    const parentId = context.getParentId(currentId);
    const siblings = parentId ? context.getChildren(parentId) : getRootBlockIds(context);

    let closestId: string | null = null;
    let closestDistance = Infinity;

    for (const siblingId of siblings) {
        if (siblingId === currentId) continue;

        const siblingWidget = context.findWidget(siblingId);
        if (!siblingWidget.success || !siblingWidget.node) continue;

        const siblingX = siblingWidget.node.x ?? 0;
        const siblingY = siblingWidget.node.y ?? 0;

        // Check if sibling is to the left (x < currentX)
        if (siblingX >= currentX) continue;

        // Check if on similar row (Y overlap)
        const currentHeight = currentWidget.node.h ?? 1;
        const siblingHeight = siblingWidget.node.h ?? 1;
        const yOverlap = Math.min(currentY + currentHeight, siblingY + siblingHeight) - Math.max(currentY, siblingY);

        if (yOverlap <= 0) continue; // No vertical overlap

        // Calculate distance (prioritize horizontal distance)
        const distance = currentX - siblingX;

        if (distance < closestDistance) {
            closestDistance = distance;
            closestId = siblingId;
        }
    }

    return closestId;
};

/**
 * Find the closest block to the right (same row, higher x value)
 */
export const getBlockToRight = (currentId: string, context: NavigationContext): string | null => {
    // Skip if in a list
    if (isBlockInList(currentId, context)) return null;

    const currentWidget = context.findWidget(currentId);
    if (!currentWidget.success || !currentWidget.node) return null;

    const currentX = currentWidget.node.x ?? 0;
    const currentY = currentWidget.node.y ?? 0;

    // Get all siblings
    const parentId = context.getParentId(currentId);
    const siblings = parentId ? context.getChildren(parentId) : getRootBlockIds(context);

    let closestId: string | null = null;
    let closestDistance = Infinity;

    for (const siblingId of siblings) {
        if (siblingId === currentId) continue;

        const siblingWidget = context.findWidget(siblingId);
        if (!siblingWidget.success || !siblingWidget.node) continue;

        const siblingX = siblingWidget.node.x ?? 0;
        const siblingY = siblingWidget.node.y ?? 0;

        // Check if sibling is to the right (x > currentX)
        if (siblingX <= currentX) continue;

        // Check if on similar row (Y overlap)
        const currentHeight = currentWidget.node.h ?? 1;
        const siblingHeight = siblingWidget.node.h ?? 1;
        const yOverlap = Math.min(currentY + currentHeight, siblingY + siblingHeight) - Math.max(currentY, siblingY);

        if (yOverlap <= 0) continue; // No vertical overlap

        // Calculate distance (prioritize horizontal distance)
        const distance = siblingX - currentX;

        if (distance < closestDistance) {
            closestDistance = distance;
            closestId = siblingId;
        }
    }

    return closestId;
};
