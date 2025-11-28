import { useCallback } from "react";
import { toast } from "sonner";
import { useBlockEnvironment } from "../context/block-environment-provider";

/**
 * Hook to guard against deletion of protected blocks.
 *
 * Checks if a block can be deleted based on its metadata.deletable flag.
 * Blocks marked with deletable=false (e.g., entity reference blocks) cannot be removed.
 *
 * @example
 * const { canDeleteBlock } = useBlockDeletionGuard();
 *
 * if (canDeleteBlock(blockId)) {
 *   // Proceed with deletion
 *   removeBlock(blockId);
 * }
 */
export const useBlockDeletionGuard = () => {
    const { getBlock } = useBlockEnvironment();

    /**
     * Checks if a block can be deleted.
     *
     * @param blockId - UUID of the block to check
     * @returns true if the block can be deleted, false if protected
     */
    const canDeleteBlock = useCallback(
        (blockId: string): boolean => {
            const node = getBlock(blockId);

            if (!node) {
                console.warn(`Block ${blockId} not found in environment`);
                return false;
            }

            const { block } = node;

            // Check if block is marked as non-deletable. Treat undefined as deletable, so only explicit false blocks are protected.
            if (block.payload.deletable === false) {
                toast.error("Cannot delete block", {
                    description: "This block is required and cannot be deleted.",
                });

                return false;
            }

            return true;
        },
        [getBlock]
    );

    return { canDeleteBlock };
};
