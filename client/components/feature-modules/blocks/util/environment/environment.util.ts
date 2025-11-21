import { now } from "@/lib/util/utils";
import { BlockNode, BlockTree, isContentNode } from "../../interface/block.interface";
import {
    DetachResult,
    EditorEnvironment,
    EditorEnvironmentMetadata,
    InsertResult,
} from "../../interface/editor.interface";
import { allowChildren, insertChild } from "../block/block.util";

/** Collect descendant ids for a node (used when removing or re-indexing). */
export const collectDescendantIds = (node: BlockNode, acc: Set<string>): void => {
    if (!isContentNode(node) || !node.children) {
        return;
    }

    node.children.forEach((child) => {
        acc.add(child.block.id);
        collectDescendantIds(child, acc);
    });
};

/**
 * Creates a deep clone of an EditorEnvironment so mutations don't leak across snapshots.
 */
export const cloneEnvironment = (environment: EditorEnvironment): EditorEnvironment => {
    return {
        trees: structuredClone(environment.trees),
        metadata: { ...environment.metadata },
        hierarchy: new Map(environment.hierarchy),
        treeIndex: new Map(environment.treeIndex),
    };
};

/**
 * Registers the entire subtree inside the hierarchy, tree index, layout, and UI maps.
 * If a layout map is provided, the node's current dimensions will be recorded.
 */
export const traverseTree = (
    node: BlockNode,
    parentId: string | null,
    treeId: string,
    hierarchy: Map<string, string | null>,
    treeIndex: Map<string, string>
): void => {
    const blockId = node.block.id;

    // Record hierarchy + ownership.
    hierarchy.set(blockId, parentId);
    treeIndex.set(blockId, treeId);

    if (!isContentNode(node)) return;
    if (!allowChildren(node) || !node.children) return;

    node.children.forEach((child) => {
        traverseTree(child, blockId, treeId, hierarchy, treeIndex);
    });
};

/** Depth-first search for a block node. */
export const findNodeById = (curr: BlockNode, targetId: string): BlockNode | undefined => {
    if (curr.block.id === targetId) {
        return curr;
    }

    if (!isContentNode(curr) || !curr.children) {
        return undefined;
    }

    let result: BlockNode | undefined = undefined;
    curr.children.forEach((child) => {
        const match = findNodeById(child, targetId);
        if (match) {
            result = match;
        }
    });

    return result;
};

export const insertTree = (
    environment: EditorEnvironment,
    newTree: BlockTree,
    index: number | null
): BlockTree[] => {
    if (index === null) return [...environment.trees, newTree];

    const trees = [...environment.trees];
    trees.splice(index, 0, newTree);
    return trees;
};

export const updateTrees = (
    environment: EditorEnvironment,
    updatedTree: BlockTree
): BlockTree[] => {
    return environment.trees.map((tree) => {
        if (getTreeId(tree) != getTreeId(updatedTree)) return tree;
        return updatedTree;
    });
};

export const updateManyTrees = (
    environment: EditorEnvironment,
    updatedTrees: BlockTree[]
): BlockTree[] => {
    return environment.trees.map((tree) => {
        const updatedTree = updatedTrees.find((t) => getTreeId(t) === getTreeId(tree));
        return updatedTree ? updatedTree : tree;
    });
};

export const findTree = (environment: EditorEnvironment, treeId: string): BlockTree | undefined => {
    return environment.trees.find((tree) => getTreeId(tree) === treeId);
};

/**
 * Remove a node from a tree and return both the updated tree and the extracted node.
 * Root removal is handled by callers, so we bail out when the requested id is the root.
 */
export const detachNode = (curr: BlockNode, blockId: string): DetachResult => {
    if (curr.block.id === blockId) {
        return {
            success: false,
            root: curr,
            detachedNode: null,
        };
    }

    if (!isContentNode(curr) || !curr.children) {
        return {
            success: false,
            root: curr,
            detachedNode: null,
        };
    }

    // Try to find the node as an immediate child first.
    const index = curr.children.findIndex((child) => child.block.id === blockId);
    if (index >= 0) {
        const newChildren = [...curr.children];
        const [detachedNode] = newChildren.splice(index, 1);
        return {
            success: true,
            root: {
                ...curr,
                children: newChildren,
            },
            detachedNode,
        };
    }

    // Recurse into children to find and detach the node.
    let success = false;
    let detachedNode: BlockNode | null = null;

    const updatedChildren: BlockNode[] = [];
    for (const child of curr.children) {
        if (success) {
            updatedChildren.push(child);
            continue;
        }

        if (!isContentNode(child)) {
            updatedChildren.push(child);
            continue;
        }

        const result = detachNode(child, blockId);
        if (result.success) {
            success = true;
            detachedNode = result.detachedNode;
            updatedChildren.push(result.root);
            continue;
        }

        updatedChildren.push(child);
    }

    return {
        success,
        root: {
            ...curr,
            children: updatedChildren,
        },
        detachedNode,
    };
};

/**
 * We use the root block id as the tree identifier.
 * @param tree The block tree to get the ID from.
 * @returns The ID of the root block.
 */
export const getTreeId = (tree: BlockTree) => {
    return tree.root.block.id;
};

/** Insert a node beneath a specific parent, returning a fresh node instance. */
export const insertNode = (
    node: BlockNode,
    parentId: string,
    nodeToInsert: BlockNode,
    index: number | null = null
): InsertResult<BlockNode> => {
    // Handle insertion at root level
    if (node.block.id === parentId) {
        // Reject insertion if root is not a content node
        if (!isContentNode(node)) {
            return {
                success: false,
                payload: node,
            };
        }

        // Insert directly under root
        const { success, payload: updatedNode } = insertChild(node, nodeToInsert, index);

        if (!success) {
            return {
                success: false,
                payload: node,
            };
        }

        return {
            success: true,
            payload: updatedNode,
        };
    }

    // If root is not a content node, there is no possibility of recursion. Bail out.
    if (!isContentNode(node) || !node.children) {
        return {
            success: false,
            payload: node,
        };
    }

    // Recurse into children to find parentId
    let success = false;

    const updatedChildren: BlockNode[] = [];
    for (const child of node.children) {
        if (success) {
            updatedChildren.push(child);
            continue;
        }

        if (child.block.id === parentId) {
            if (!isContentNode(child)) {
                updatedChildren.push(child);
                continue;
            }

            const { success: insertSuccess, payload: updatedChild } = insertChild(
                child,
                nodeToInsert,
                index
            );
            success = insertSuccess;
            updatedChildren.push(updatedChild);
            continue;
        }

        if (!isContentNode(child)) {
            updatedChildren.push(child);
            continue;
        }

        const result = insertNode(child, parentId, nodeToInsert, index);
        if (result.success) {
            success = true;
        }
        updatedChildren.push(result.payload);
    }

    return {
        success,
        payload: {
            ...node,
            children: updatedChildren,
        },
    };
};

/** Replace a node in-place, returning a new tree. */
export const replaceNode = (curr: BlockNode, replacement: BlockNode): BlockNode => {
    const blockId = replacement.block.id;
    if (curr.block.id === blockId) {
        return replacement;
    }

    if (!isContentNode(curr) || !curr.children) {
        return curr;
    }

    const updatedChildren = curr.children.map((child) => {
        if (child.block.id === blockId) return replacement;
        if (!isContentNode(child)) return child;
        return replaceNode(child, replacement);
    });

    return {
        ...curr,
        children: updatedChildren,
    };
};

/**
 * Reorder a child within a parent's children array.
 * Used for list reordering where the parent doesn't change, only the child's index.
 */
export const reorderNode = (
    curr: BlockNode,
    parentId: string,
    childId: string,
    targetIndex: number
): InsertResult<BlockNode> => {
    // If we found the parent
    if (curr.block.id === parentId) {
        if (!isContentNode(curr) || !curr.children) {
            return {
                success: false,
                payload: curr,
            };
        }

        // Find the child's current index
        const currentIndex = curr.children.findIndex((child) => child.block.id === childId);

        if (currentIndex === -1) {
            return {
                success: false,
                payload: curr,
            };
        }

        // If already at target index, no change needed
        if (currentIndex === targetIndex) {
            return {
                success: true,
                payload: curr,
            };
        }

        // Reorder the children array
        const newChildren = [...curr.children];
        const [movedChild] = newChildren.splice(currentIndex, 1);

        // Clamp targetIndex to [0, newChildren.length]
        const clampedIndex = Math.max(0, Math.min(targetIndex, newChildren.length));
        newChildren.splice(clampedIndex, 0, movedChild);

        return {
            success: true,
            payload: {
                ...curr,
                children: newChildren,
            },
        };
    }

    // If curr is not a content node or has no children, can't recurse
    if (!isContentNode(curr) || !curr.children) {
        return {
            success: false,
            payload: curr,
        };
    }

    // Recurse into children to find the parent
    let success = false;
    const updatedChildren: BlockNode[] = [];

    for (const child of curr.children) {
        if (success) {
            updatedChildren.push(child);
            continue;
        }

        const result = reorderNode(child, parentId, childId, targetIndex);
        if (result.success) {
            success = true;
        }
        updatedChildren.push(result.payload);
    }

    return {
        success,
        payload: {
            ...curr,
            children: updatedChildren,
        },
    };
};

/** Update environment metadata timestamp after a mutation. */
export const updateMetadata = (metadata: EditorEnvironmentMetadata): EditorEnvironmentMetadata => {
    return {
        ...metadata,
        updatedAt: now(),
    };
};

/**
 * Initialise an empty editor environment for the given organisation id.
 */
export function createEmptyEnvironment(organisationId: string): EditorEnvironment {
    const timestamp = now();

    return {
        trees: [],
        hierarchy: new Map(),
        treeIndex: new Map(),
        metadata: {
            name: "Untitled Environment",
            organisationId,
            description: undefined,
            createdAt: timestamp,
            updatedAt: timestamp,
        },
    };
}

/**
 * Hydrate an environment from a set of top-level tree instances supplied by callers.
 */
export interface EnvironmentInitResult {
    environment: EditorEnvironment;
}

export const init = (
    organisationId: string,
    initialTrees: BlockTree[] = []
): EnvironmentInitResult => {
    if (!initialTrees || initialTrees.length === 0) {
        return {
            environment: createEmptyEnvironment(organisationId),
        };
    }

    const hierarchy = new Map<string, string | null>();
    const treeIndex = new Map<string, string>();

    initialTrees.forEach((instance) => {
        const rootId = instance.root.block.id;

        hierarchy.set(rootId, null);
        treeIndex.set(rootId, rootId);

        if (!isContentNode(instance.root)) return;
        if (!allowChildren(instance.root) || !instance.root.children) return;

        instance.root.children.forEach((child) => {
            // Recursively traverse the tree
            traverseTree(child, rootId, rootId, hierarchy, treeIndex);
        });
    });

    return {
        environment: {
            trees: initialTrees,
            hierarchy,
            treeIndex,
            metadata: {
                name: "Untitled Environment",
                description: undefined,
                organisationId,
                createdAt: now(),
                updatedAt: now(),
            },
        },
    };
};

/**
 * Returns the node IDs from the root to the given targetId (inclusive).
 * Bottom-up collection (following parents) + reverse to get root → … → target.
 *
 * If a path cannot be constructed (due to missing links), returns undefined.
 */
export const generatePath = (env: EditorEnvironment, targetId: string): string[] | undefined => {
    const { hierarchy, treeIndex } = env;

    // Collect upward from the target
    const visited = new Set<string>();
    const upward: string[] = [];

    const root = treeIndex.get(targetId);

    // Begin Traversal from targetId to root
    traversePath(targetId, hierarchy, visited, upward);

    // `upward` is [target, ..., root], so reverse to get [root, ..., target].
    const path = upward.reverse();
    if (path.length === 0) return undefined;

    // Assert that the path is valid (ie. starts with root and ends with targetId)
    if (path[path.length - 1] !== targetId) return undefined;
    if (path[0] !== root) return undefined;

    return path;
};

export const traversePath = (
    curr: string,
    hierarchy: Map<string, string | null>,
    visited: Set<string>,
    path: string[]
) => {
    if (visited.has(curr)) {
        throw new Error(`Cycle detected while traversing parents (at "${curr}")`);
    }
    visited.add(curr);
    path.push(curr);

    const parent = hierarchy.has(curr) ? hierarchy.get(curr)! : null;

    // Base case: if no parent, we're at the root
    if (parent === null) return;

    traversePath(parent, hierarchy, visited, path);
};
