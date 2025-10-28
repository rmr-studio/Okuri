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
function collectDescendantIds(node: BlockNode, acc: Set<string>): void {
    if (!isContentNode(node) || !node.children) {
        return;
    }

    Object.values(node.children).forEach((slotChildren) => {
        slotChildren.forEach((child) => {
            acc.add(child.block.id);
            collectDescendantIds(child, acc);
        });
    });
}

/**
 * Registers the entire subtree inside the hierarchy, tree index, layout, and UI maps.
 * `skipExistingLayout` lets callers keep a precomputed layout for the root node.
 */
function traverseTree(
    node: BlockNode,
    parentId: string | null,
    treeId: string,
    hierarchy: Map<string, string | null>,
    treeIndex: Map<string, string>,
    layouts: Map<string, GridRect>,
    skipExistingLayout = false
): void {
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
}

/** Depth-first search for a block node. */
function findNodeById(node: BlockNode, targetId: string): BlockNode | undefined {
    if (node.block.id === targetId) {
        return node;
    }

    if (!isContentNode(node) || !node.children) {
        return undefined;
    }

    for (const slotChildren of Object.values(node.children)) {
        for (const child of slotChildren) {
            const match = findNodeById(child, targetId);
            if (match) {
                return match;
            }
        }
    }

    return undefined;
}

interface DetachResult {
    updatedTree: BlockTree;
    detachedNode: BlockNode;
    slotName: string | null;
}

/**
 * Remove a node from a tree and return both the updated tree and the extracted node.
 * Root removal is handled by callers, so we bail out when the requested id is the root.
 */
function detachNode(tree: BlockTree, blockId: string): DetachResult | null {
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
}

/** Insert a node beneath a specific parent/slot, returning a fresh tree instance. */
function insertNode(
    tree: BlockTree,
    parentId: string,
    slotName: string,
    nodeToInsert: BlockNode
): BlockTree {
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
}

/** Replace a node in-place, returning a new tree. */
function replaceNode(tree: BlockTree, blockId: string, replacement: BlockNode): BlockTree {
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
            return replaceNode({ ...tree, root: child }, blockId, replacement).root;
        });
    });

    return {
        ...tree,
        root: {
            ...rootNode,
            children: updatedChildren,
        },
    };
}

/**
 * Produces the next available layout slot for a block under `parentId`.
 * Computes the lowest free row by scanning sibling layouts.
 */
function calculateNextLayout(
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
function updateMetadata(metadata: EditorEnvironmentMetadata): EditorEnvironmentMetadata {
    return {
        ...metadata,
        updatedAt: nowIso(),
    };
}

/** Gather every block id contained in a tree. */
function collectTreeBlockIds(tree: BlockTree): string[] {
    const ids: string[] = [tree.root.block.id];
    const stack: BlockNode[] = [tree.root];

    while (stack.length > 0) {
        const node = stack.pop()!;
        if (!isContentNode(node) || !node.children) {
            continue;
        }

        Object.values(node.children).forEach((slotChildren) => {
            slotChildren.forEach((child) => {
                ids.push(child.block.id);
                stack.push(child);
            });
        });
    }

    return ids;
}

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
