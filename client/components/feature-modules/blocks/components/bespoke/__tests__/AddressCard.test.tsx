import { render, screen } from "@testing-library/react";
import { AddressCard } from "../AddressCard";

describe("AddressCard", () => {
    it("renders default title when none provided", () => {
        const Component = AddressCard.component;
        render(<Component address={{ city: "Sydney" }} />);

        expect(screen.getByText("Address")).toBeInTheDocument();
        expect(screen.getByText("Sydney")).toBeInTheDocument();
    });

    it("renders full address metadata", () => {
        const Component = AddressCard.component;
        render(
            <Component
                title="Head Office"
                address={{
                    street: "123 Harbour Rd",
                    city: "Sydney",
                    state: "NSW",
                    postalCode: "2000",
                    country: "Australia",
                }}
            />
        );

        expect(screen.getByText("Head Office")).toBeInTheDocument();
        expect(screen.getByText("123 Harbour Rd")).toBeInTheDocument();
        expect(screen.getByText("Sydney, NSW, 2000")).toBeInTheDocument();
        expect(screen.getByText("Australia")).toBeInTheDocument();
    });
});
