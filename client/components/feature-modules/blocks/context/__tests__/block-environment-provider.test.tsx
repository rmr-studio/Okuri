import React, { PropsWithChildren } from "react";
import { renderHook, act } from "@testing-library/react";
import { BlockEnvironmentProvider, useBlockEnvironment } from "../block-environment-provider";
import { createLayoutContainerNode } from "../../util/block/factory/mock.factory";
import { BlockTree } from "../../interface/block.interface";
import { GridRect } from "@/lib/interfaces/common.interface";

const ORGANISATION_ID = "org-test";

const createProviderWrapper = () => {
    const rootNode = createLayoutContainerNode(ORGANISATION_ID);
    const initialTrees: BlockTree[] = [
        {
            type: "block_tree",
            root: rootNode,
        },
    ];

    const Wrapper = ({ children }: PropsWithChildren) => (
        <BlockEnvironmentProvider organisationId={ORGANISATION_ID} initialTrees={initialTrees}>
            {children}
        </BlockEnvironmentProvider>
    );

    const childId = rootNode.children?.[0]?.block.id;
    if (!childId) {
        throw new Error("layout container mock must include at least one child block");
    }

    return {
        rootId: rootNode.block.id,
        childId,
        wrapper: Wrapper,
    };
};

describe("BlockEnvironmentProvider layout helpers", () => {
    it("updates a single block layout via updateLayout", () => {
        const { wrapper, rootId, childId } = createProviderWrapper();

        const { result } = renderHook(() => useBlockEnvironment(), { wrapper });

        const nextLayout: GridRect = {
            x: 3,
            y: 1,
            width: 6,
            height: 8,
            locked: false,
        };

        act(() => {
            result.current.updateLayout(rootId, nextLayout);
        });

        const updatedRoot = result.current.getBlock(rootId);
        expect(updatedRoot?.block.layout).toEqual(nextLayout);

        const childNode = result.current.getBlock(childId);
        expect(childNode?.block.layout).toBeUndefined();
    });

    it("applies multiple layout updates atomically via updateLayouts", () => {
        const { wrapper, rootId, childId } = createProviderWrapper();

        const { result } = renderHook(() => useBlockEnvironment(), { wrapper });

        const rootLayout: GridRect = {
            x: 0,
            y: 0,
            width: 8,
            height: 10,
            locked: false,
        };

        const childLayout: GridRect = {
            x: 2,
            y: 5,
            width: 4,
            height: 7,
            locked: false,
        };

        act(() => {
            result.current.updateLayouts({
                [rootId]: rootLayout,
                [childId]: childLayout,
            });
        });

        const updatedRoot = result.current.getBlock(rootId);
        const updatedChild = result.current.getBlock(childId);

        expect(updatedRoot?.block.layout).toEqual(rootLayout);
        expect(updatedChild?.block.layout).toEqual(childLayout);

        expect(result.current.getParentId(childId)).toEqual(rootId);
    });
});
