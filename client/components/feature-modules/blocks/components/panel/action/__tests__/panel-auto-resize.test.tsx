import { act, renderHook } from "@testing-library/react";
import { usePanelAutoResize } from "../use-panel-auto-resize";

jest.mock("../../../../context/grid-provider", () => ({
    useGrid: jest.fn(),
}));

const mockUseGrid = jest.requireMock("../../../../context/grid-provider").useGrid as jest.Mock;

const createBoundingRect = (height: number): DOMRect => ({
    x: 0,
    y: 0,
    width: 100,
    height,
    top: 0,
    left: 0,
    bottom: height,
    right: 100,
    toJSON: () => ({}),
});

describe("usePanelAutoResize", () => {
    let update: jest.Mock;
    let gridInstance: { el: HTMLElement; opts: { cellHeight: number; margin: number }; update: jest.Mock };
    let widgetEl: HTMLElement;
    let gridEl: HTMLElement;
    let resizeCallback: ResizeObserverCallback | null = null;

    beforeAll(() => {
        (global.requestAnimationFrame as any) =
            global.requestAnimationFrame ||
            ((cb: FrameRequestCallback) => {
                cb(0);
                return 0;
            });
        (global.cancelAnimationFrame as any) =
            global.cancelAnimationFrame || (() => undefined);
    });

    beforeEach(() => {
        jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
            cb(0);
            return 0;
        });
        jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

        update = jest.fn();
        widgetEl = document.createElement("div");
        widgetEl.setAttribute("gs-id", "panel-1");
        widgetEl.setAttribute("gs-h", "2");
        widgetEl.getBoundingClientRect = () => createBoundingRect(80);

        gridEl = document.createElement("div");
        gridEl.appendChild(widgetEl);

        gridInstance = {
            el: gridEl,
            opts: {
                cellHeight: 40,
                margin: 8,
            },
            update,
        };

        (widgetEl as any).gridstackNode = { grid: gridInstance };

        mockUseGrid.mockReturnValue({
            gridStack: gridInstance,
        });

        resizeCallback = null;
        class MockResizeObserver {
            callback: ResizeObserverCallback;
            constructor(cb: ResizeObserverCallback) {
                this.callback = cb;
                resizeCallback = cb;
            }
            observe = jest.fn();
            disconnect = jest.fn();
            unobserve = jest.fn();
        }
        (global as any).ResizeObserver = MockResizeObserver;
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.clearAllMocks();
    });

    const createResizeEntry = (target: Element, height: number): ResizeObserverEntry => ({
        target,
        contentRect: createBoundingRect(height),
        borderBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
        contentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
        devicePixelContentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
    });

    it("expands grid rows when content exceeds current height", () => {
        const panelEl = document.createElement("div");
        Object.defineProperty(panelEl, "scrollHeight", { value: 125, configurable: true });

        const { result } = renderHook(() => usePanelAutoResize("panel-1"));

        act(() => {
            result.current(panelEl);
        });

        act(() => {
            resizeCallback?.([createResizeEntry(panelEl, 125)], {} as ResizeObserver);
        });

        expect(update).toHaveBeenCalledWith(widgetEl, { h: 4, minH: 4 });
    });

    it("shrinks grid rows when content decreases", () => {
        widgetEl.setAttribute("gs-h", "3");
        widgetEl.getBoundingClientRect = () => createBoundingRect(120);

        const panelEl = document.createElement("div");
        Object.defineProperty(panelEl, "scrollHeight", { value: 60, configurable: true });

        const { result } = renderHook(() => usePanelAutoResize("panel-1"));

        act(() => {
            result.current(panelEl);
        });

        act(() => {
            resizeCallback?.([createResizeEntry(panelEl, 60)], {} as ResizeObserver);
        });

        expect(update).toHaveBeenCalledWith(widgetEl, { h: 2, minH: 2 });
    });

    it("does not update while the widget is actively resizing", () => {
        widgetEl.classList.add("ui-resizable-resizing");

        const panelEl = document.createElement("div");
        Object.defineProperty(panelEl, "scrollHeight", { value: 140, configurable: true });

        const { result } = renderHook(() => usePanelAutoResize("panel-1"));

        act(() => {
            result.current(panelEl);
        });

        act(() => {
            resizeCallback?.([createResizeEntry(panelEl, 140)], {} as ResizeObserver);
        });

        expect(update).not.toHaveBeenCalled();

        widgetEl.classList.remove("ui-resizable-resizing");
    });

    it("uses the owning subgrid when available", () => {
        const parentUpdate = jest.fn();
        const subGridUpdate = jest.fn();

        const parentGrid = {
            el: gridEl,
            opts: {
                cellHeight: 40,
                margin: 8,
            },
            update: parentUpdate,
        };

        const subGrid = {
            el: gridEl,
            opts: {
                cellHeight: 30,
                margin: 4,
            },
            update: subGridUpdate,
        };

        mockUseGrid.mockReturnValue({ gridStack: parentGrid });
        (widgetEl as any).gridstackNode = { grid: subGrid };

        const panelEl = document.createElement("div");
        Object.defineProperty(panelEl, "scrollHeight", { value: 120, configurable: true });

        const { result } = renderHook(() => usePanelAutoResize("panel-1"));

        act(() => {
            result.current(panelEl);
        });

        act(() => {
            resizeCallback?.([createResizeEntry(panelEl, 120)], {} as ResizeObserver);
        });

        expect(subGridUpdate).toHaveBeenCalled();
        expect(parentUpdate).not.toHaveBeenCalled();
        const subGridArgs = subGridUpdate.mock.calls[0];
        expect(subGridArgs?.[1]).toMatchObject({ minH: expect.any(Number) });
    });
});
