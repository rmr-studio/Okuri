import { nowIso } from "@/lib/util/utils";
import { BlockNode, BlockTree, GridRect, isContentNode } from "../../interface/block.interface";
import {
    DetachResult,
    EditorEnvironment,
    EditorEnvironmentMetadata,
    InsertResult,
} from "../../interface/editor.interface";
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
    treeIndex: Map<string, string>
): void => {
    const blockId = node.block.id;

    // Record hierarchy + ownership.
    hierarchy.set(blockId, parentId);
    treeIndex.set(blockId, treeId);

    if (!isContentNode(node)) return;
    if (!allowChildren(node) || !node.children) return;

    Object.values(node.children).forEach((slotChildren) => {
        slotChildren.forEach((child) => {
            traverseTree(child, blockId, treeId, hierarchy, treeIndex);
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
export const detachNode = (tree: BlockTree, blockId: string): DetachResult => {
    if (tree.root.block.id === blockId) {
        return {
            success: false,
            tree,
            detachedNode: null,
            slotName: null,
        };
    }

    const rootNode = tree.root;
    if (!isContentNode(rootNode) || !rootNode.children) {
        return {
            success: false,
            tree,
            detachedNode: null,
            slotName: null,
        };
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
                success: true,
                tree: {
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

            newNodes[i] = result.tree.root;
            const updatedChildren = { ...rootNode.children, [slotName]: newNodes };
            return {
                success: true,
                tree: {
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

    return {
        success: false,
        tree,
        detachedNode: null,
        slotName: null,
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

/** Insert a node beneath a specific parent/slot, returning a fresh tree instance. */
export const insertNode = (
    tree: BlockTree,
    parentId: string,
    slotName: string,
    nodeToInsert: BlockNode,
    index: number | null = null
): InsertResult<BlockTree> => {
    // Handle insertion at root level
    if (tree.root.block.id === parentId) {
        // Reject insertion if root is not a content node
        if (!isContentNode(tree.root)) {
            return {
                success: false,
                payload: tree,
            };
        }

        // Insert directly under root
        const { success, payload: node } = insertChild(tree.root, nodeToInsert, slotName, index);

        if (!success) {
            return {
                success: false,
                payload: tree,
            };
        }

        return {
            success: true,
            payload: {
                ...tree,
                root: node,
            },
        };
    }

    // We need to recurse into children
    const rootNode = tree.root;

    // If root is not a content node, there is no possibility of recursion. Bail out.
    if (!isContentNode(rootNode) || !rootNode.children) {
        return {
            success: false,
            payload: tree,
        };
    }

    // Recurse into children to find parentId
    let success = false;

    const updatedChildren: Record<string, BlockNode[]> = {};
    Object.entries(rootNode.children).forEach(([slot, nodes]) => {
        updatedChildren[slot] = nodes.map((child) => {
            // If we arrive at the parent, perform insertion
            if (child.block.id === parentId) {
                if (!isContentNode(child)) {
                    return child;
                }

                const { success: insertSuccess, payload: node } = insertChild(
                    child,
                    nodeToInsert,
                    slotName,
                    index
                );
                success = insertSuccess;
                return node;
            }

            if (!isContentNode(child)) {
                return child;
            }

            // Recurse further down the tree

            const result = insertNode(
                { ...tree, root: child },
                parentId,
                slotName,
                nodeToInsert,
                index
            );
            if (result.success) {
                success = true;
            }
            // Update the new root node
            return result.payload.root;
        });
    });

    return {
        success,
        payload: {
            ...tree,
            root: {
                ...rootNode,
                children: updatedChildren,
            },
        },
    };
};

export const insertNodeAux = () => {};

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
                traverseTree(child, rootId, rootId, hierarchy, treeIndex);
            });
        });
    });

    return {
        trees: initialTrees,
        hierarchy,
        treeIndex,
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
    console.log("Generating layout for node", node.block.id);

    // Otherwise, generate a default layout based on index and existing layout config
    const defaultLayout: GridRect = getCurrentDimensions(node);
    return {
        ...defaultLayout,
        y: index * (defaultLayout.height + 1), // Stack vertically with spacing
    };
};
