import { nowIso } from "@/lib/util/utils";
import { BlockNode, BlockTree, GridRect, isContentNode } from "../../interface/block.interface";
import { EditorEnvironment, EditorEnvironmentMetadata } from "../../interface/editor.interface";
import { allowChildren, getCurrentDimensions, insertChild } from "../block/block.util";

/**
 * Builds a new block tree instance from an existing node. Where that node becomes
 * the root of a new tree.
 *
 * @param node
 * @returns [BlockTree] the new tree instance
 */
function buildTreeFromNode(node: BlockNode): BlockTree {
    return {
        type: "block_tree",
        root: node,
    };
}

/** Collect descendant ids for a node (used when removing or re-indexing). */
export const collectDescendantIds = (node: BlockNode, acc: Set<string>): void => {
    if (!isContentNode(node) || !node.children) {
        return;
    }

    Object.values(node.children).forEach((slotChildren) => {
        slotChildren.forEach((child) => {
            acc.add(child.block.id);
            collectDescendantIds(child, acc);
        });
    });
};

/**
 * Registers the entire subtree inside the hierarchy, tree index, layout, and UI maps.
 * `skipExistingLayout` lets callers keep a precomputed layout for the root node.
 */
export const traverseTree = (
    node: BlockNode,
    parentId: string | null,
    treeId: string,
    hierarchy: Map<string, string | null>,
    treeIndex: Map<string, string>,
    layouts: Map<string, GridRect>,
    skipExistingLayout = false
): void => {
    const blockId = node.block.id;

    // Record hierarchy + ownership.
    hierarchy.set(blockId, parentId);
    treeIndex.set(blockId, treeId);

    // Lazy initialise layout and UI metadata when absent.
    if (!skipExistingLayout || !layouts.has(blockId)) {
        const defaultLayout: GridRect = getCurrentDimensions(node);
        layouts.set(blockId, layouts.get(blockId) ?? { ...defaultLayout });
    }

    if (!isContentNode(node)) return;
    if (!allowChildren(node) || !node.children) return;

    Object.values(node.children).forEach((slotChildren) => {
        slotChildren.forEach((child) => {
            traverseTree(child, blockId, treeId, hierarchy, treeIndex, layouts);
        });
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

    for (const slotChildren of Object.values(curr.children)) {
        for (const child of slotChildren) {
            const match = findNodeById(child, targetId);
            if (match) {
                return match;
            }
        }
    }

    return undefined;
};

interface DetachResult {
    updatedTree: BlockTree;
    detachedNode: BlockNode;
    slotName: string | null;
}

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
export const detachNode = (tree: BlockTree, blockId: string): DetachResult | null => {
    if (tree.root.block.id === blockId) {
        return null;
    }

    const rootNode = tree.root;
    if (!isContentNode(rootNode) || !rootNode.children) {
        return null;
    }

    // Try to find the node as an immediate child first.
    for (const [slotName, nodes] of Object.entries(rootNode.children)) {
        const index = nodes.findIndex((node) => node.block.id === blockId);
        if (index >= 0) {
            const newNodes = [...nodes];
            const [detachedNode] = newNodes.splice(index, 1);

            const updatedChildren = { ...rootNode.children };
            if (newNodes.length > 0) {
                updatedChildren[slotName] = newNodes;
            } else {
                delete updatedChildren[slotName];
            }

            return {
                updatedTree: {
                    ...tree,
                    root: {
                        ...rootNode,
                        children: updatedChildren,
                    },
                },
                detachedNode,
                slotName,
            };
        }
    }

    // Otherwise recurse into descendants.
    for (const [slotName, nodes] of Object.entries(rootNode.children)) {
        const newNodes = [...nodes];
        for (let i = 0; i < newNodes.length; i += 1) {
            const child = newNodes[i];
            if (!isContentNode(child)) {
                continue;
            }

            const result = detachNode({ ...tree, root: child }, blockId);
            if (!result) {
                continue;
            }

            newNodes[i] = result.updatedTree.root;
            const updatedChildren = { ...rootNode.children, [slotName]: newNodes };
            return {
                updatedTree: {
                    ...tree,
                    root: {
                        ...rootNode,
                        children: updatedChildren,
                    },
                },
                detachedNode: result.detachedNode,
                slotName: result.slotName,
            };
        }
    }

    return null;
};

/**
 * We use the root block id as the tree identifier.
 * @param tree The block tree to get the ID from.
 * @returns The ID of the root block.
 */
export const getTreeId = (tree: BlockTree) => {
    return tree.root.block.id;
};

/** Insert a node beneath a specific parent/slot, returning a fresh tree instance. */
export const insertNode = (
    tree: BlockTree,
    parentId: string,
    slotName: string,
    nodeToInsert: BlockNode,
    index: number | null = null
): BlockTree => {
    if (tree.root.block.id === parentId) {
        // Disallow inserting into reference nodes
        if (!isContentNode(tree.root)) return tree;
        const node = insertChild(tree.root, nodeToInsert, slotName);
        return {
            ...tree,
            root: node,
        };
    }

    // Recurse into children

    const rootNode = tree.root;
    if (!isContentNode(rootNode) || !rootNode.children) {
        return tree;
    }

    // Create a new child node with the updated index, if set to null, append to end
    const updatedChildren: Record<string, BlockNode[]> = {};
    Object.entries(rootNode.children).forEach(([slot, nodes]) => {
        updatedChildren[slot] = nodes.map((child) => {
            if (child.block.id === parentId) {
                if (!isContentNode(child)) {
                    return child;
                }
                return insertChild(child, nodeToInsert, slotName);
            }
            if (!isContentNode(child)) {
                return child;
            }
            return insertNode({ ...tree, root: child }, parentId, slotName, nodeToInsert).root;
        });
    });

    return {
        ...tree,
        root: {
            ...rootNode,
            children: updatedChildren,
        },
    };
};

/** Replace a node in-place, returning a new tree. */
export const replaceNode = (tree: BlockTree, replacement: BlockNode): BlockTree => {
    const blockId = replacement.block.id;
    if (tree.root.block.id === blockId) {
        return {
            ...tree,
            root: replacement,
        };
    }

    const rootNode = tree.root;
    if (!isContentNode(rootNode) || !rootNode.children) {
        return tree;
    }

    const updatedChildren: Record<string, BlockNode[]> = {};
    Object.entries(rootNode.children).forEach(([slot, nodes]) => {
        updatedChildren[slot] = nodes.map((child) => {
            if (child.block.id === blockId) {
                return replacement;
            }
            if (!isContentNode(child)) {
                return child;
            }
            return replaceNode({ ...tree, root: child }, replacement).root;
        });
    });

    return {
        ...tree,
        root: {
            ...rootNode,
            children: updatedChildren,
        },
    };
};

/**
 * After any structural changes to a tree, we may need to recalculate layouts to ensure
 * that the dimensions are sufficient enough to contain all children without overlap or scrolling
 */
export const calculateTreeLayout = () => {};

/**
 * Produces the next available layout slot for a block under `parentId`.
 * Computes the lowest free row by scanning sibling layouts.
 */
export function calculateNextLayout(
    block: BlockNode,
    layouts: Map<string, GridRect>,
    hierarchy: Map<string, string | null>,
    parentId: string | null
): GridRect {
    const siblingIds = Array.from(hierarchy.entries())
        .filter(([, parent]) => parent === parentId)
        .map(([id]) => id);

    let maxY = 0;
    siblingIds.forEach((id) => {
        const layout = layouts.get(id);
        if (!layout) {
            return;
        }
        const bottom = layout.y + layout.height;
        if (bottom > maxY) {
            maxY = bottom;
        }
    });

    return {
        ...getCurrentDimensions(block),
        y: maxY > 0 ? maxY + 1 : 0,
    };
}

/** Update environment metadata timestamp after a mutation. */
export const updateMetadata = (metadata: EditorEnvironmentMetadata): EditorEnvironmentMetadata => {
    return {
        ...metadata,
        updatedAt: nowIso(),
    };
};

/**
 * Initialise an empty editor environment for the given organisation id.
 */
export function createEmptyEnvironment(organisationId: string): EditorEnvironment {
    const timestamp = nowIso();

    return {
        trees: [],
        hierarchy: new Map(),
        treeIndex: new Map(),
        layouts: new Map(),
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
export const init = (organisationId: string, initialTrees: BlockTree[] = []): EditorEnvironment => {
    if (!initialTrees || initialTrees.length === 0) {
        return createEmptyEnvironment(organisationId);
    }

    const hierarchy = new Map<string, string | null>();
    const treeIndex = new Map<string, string>();
    const layouts = new Map<string, GridRect>();

    initialTrees.forEach((instance, index) => {
        const rootId = instance.root.block.id;
        const rootLayout = generateTreeLayout(instance.root, index);

        hierarchy.set(rootId, null);
        treeIndex.set(rootId, rootId);
        layouts.set(rootId, rootLayout);

        if (!isContentNode(instance.root)) return;
        if (!allowChildren(instance.root) || !instance.root.children) return;

        // Traverse children
        Object.values(instance.root.children).forEach((slot: BlockNode[]) => {
            slot.forEach((child) => {
                // Recursively traverse the tree
                traverseTree(child, rootId, rootId, hierarchy, treeIndex, layouts);
            });
        });
    });

    return {
        trees: initialTrees,
        hierarchy,
        treeIndex,
        layouts,
        metadata: {
            name: "Untitled Environment",
            description: undefined,
            organisationId,
            createdAt: nowIso(),
            updatedAt: nowIso(),
        },
    };
};

export const generateTreeLayout = (node: BlockNode, index: number = 1): GridRect => {
    // If we have already generated a layout for this node, return it
    if (node.block.layout) return node.block.layout;

    // Otherwise, generate a default layout based on index and existing layout config
    const defaultLayout: GridRect = getCurrentDimensions(node);
    return {
        ...defaultLayout,
        y: index * (defaultLayout.height + 1), // Stack vertically with spacing
    };
};
