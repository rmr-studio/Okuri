import { render, screen } from "@testing-library/react";
import { ContactCard } from "../ContactCard";

describe("ContactCard", () => {
    it("renders client details", () => {
        const Component = ContactCard.component;
        render(
            <Component
                client={{
                    id: "client-1",
                    name: "Jane Doe",
                    contact: { email: "jane@example.com" },
                    company: { name: "Acme Corp" },
                    archived: false,
                    type: "VIP",
                }}
                accounts={[
                    {
                        entityId: "acct-1",
                        name: "Primary Account",
                    },
                ]}
            />
        );

        expect(screen.getByText("Jane Doe")).toBeInTheDocument();
        expect(screen.getByText("jane@example.com")).toBeInTheDocument();
        expect(screen.getByText("Primary Account")).toBeInTheDocument();
        expect(screen.getByText("VIP")).toBeInTheDocument();
    });

    it("wraps content with a link when href provided", () => {
        const Component = ContactCard.component;
        render(
            <Component
                client={{
                    id: "client-2",
                    name: "John Smith",
                    contact: { email: "john@example.com" },
                    company: { name: "Widgets Ltd" },
                    archived: false,
                    type: "Standard",
                }}
                href="/clients/client-2"
            />
        );

        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/clients/client-2");
    });
});
