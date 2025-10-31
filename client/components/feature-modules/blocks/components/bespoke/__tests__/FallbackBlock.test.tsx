import { render, screen } from "@testing-library/react";
import { FallbackBlock } from "../FallbackBlock";

describe("FallbackBlock", () => {
    it("renders a default message", () => {
        const Component = FallbackBlock.component;
        render(<Component />);

        expect(screen.getByText("Unsupported component")).toBeInTheDocument();
    });

    it("renders the provided reason", () => {
        const Component = FallbackBlock.component;
        render(<Component reason="Missing implementation" />);

        expect(screen.getByText("Unsupported component: Missing implementation")).toBeInTheDocument();
    });
});
