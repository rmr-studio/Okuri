import { renderHook } from "@testing-library/react";
import { GridStackNode } from "gridstack";
import { useEnvironmentGridSync } from "../use-environment-grid-sync";

jest.mock("../../context/grid-provider", () => ({
    useGrid: jest.fn(),
}));

jest.mock("../../context/block-environment-provider", () => ({
    useBlockEnvironment: jest.fn(),
}));

jest.mock("../../util/grid/grid.util", () => ({
    getNewParentId: jest.fn(),
}));

const listeners: Record<string, (...args: any[]) => void> = {};

const gridStackMock = {
    on: jest.fn((event: string, handler: (...args: any[]) => void) => {
        listeners[event] = handler;
        return gridStackMock;
    }),
    off: jest.fn((event: string) => {
        delete listeners[event];
        return gridStackMock;
    }),
    engine: {
        nodes: [],
    },
};

const updateLayouts = jest.fn();
const moveBlock = jest.fn();
const getParentId = jest.fn();
const getNewParentId = jest.requireMock("../../util/grid/grid.util").getNewParentId as jest.Mock;

const mockUseGrid = jest.requireMock("../../context/grid-provider").useGrid as jest.Mock;
const mockUseBlockEnvironment = jest.requireMock(
    "../../context/block-environment-provider"
).useBlockEnvironment as jest.Mock;

const resetMocks = () => {
    Object.keys(listeners).forEach((key) => delete listeners[key]);
    gridStackMock.on.mockClear();
    gridStackMock.off.mockClear();
    updateLayouts.mockClear();
    moveBlock.mockClear();
    getParentId.mockClear();
    getNewParentId.mockReset();
};

const createNode = (overrides: Partial<GridStackNode> = {}): GridStackNode =>
    ({
        id: "block-1",
        x: 1,
        y: 2,
        w: 3,
        h: 4,
        locked: false,
        ...overrides,
    }) as GridStackNode;

describe("useEnvironmentGridSync", () => {
    beforeEach(() => {
        resetMocks();

        mockUseGrid.mockReturnValue({
            gridStack: gridStackMock,
        });

        mockUseBlockEnvironment.mockReturnValue({
            environment: { treeIndex: new Map(), hierarchy: new Map() },
            isInitialized: true,
            getParentId,
            moveBlock,
            updateLayouts,
        });
    });

    it("registers GridStack layout event listeners", () => {
        renderHook(() => useEnvironmentGridSync(null));

        expect(gridStackMock.on).toHaveBeenCalledWith("change", expect.any(Function));
        expect(gridStackMock.on).toHaveBeenCalledWith("dragstop", expect.any(Function));
        expect(gridStackMock.on).toHaveBeenCalledWith("resizestop", expect.any(Function));
        expect(gridStackMock.on).toHaveBeenCalledWith("dropped", expect.any(Function));
        expect(gridStackMock.on).toHaveBeenCalledWith("added", expect.any(Function));
    });

    it("coalesces layout changes and forwards to updateLayouts", () => {
        renderHook(() => useEnvironmentGridSync(null));

        const changeHandler = listeners["change"];
        expect(changeHandler).toBeDefined();

        changeHandler?.({}, [createNode({ id: "block-1" })]);

        expect(updateLayouts).toHaveBeenCalledWith({
            "block-1": { x: 1, y: 2, width: 3, height: 4, locked: false },
        });
    });

    it("moves block when added to a new parent grid", () => {
        mockUseBlockEnvironment.mockReturnValue({
            environment: { treeIndex: new Map(), hierarchy: new Map() },
            isInitialized: true,
            getParentId: jest.fn().mockReturnValue("parent-1"),
            moveBlock,
            updateLayouts,
        });

        getNewParentId.mockReturnValue("parent-2");

        renderHook(() => useEnvironmentGridSync(null));

        const addedHandler = listeners["added"];
        expect(addedHandler).toBeDefined();

        addedHandler?.({}, [createNode({ id: "block-1" })]);

        expect(moveBlock).toHaveBeenCalledWith("block-1", "parent-2");
        expect(updateLayouts).toHaveBeenCalledWith({
            "block-1": { x: 1, y: 2, width: 3, height: 4, locked: false },
        });
    });
});
