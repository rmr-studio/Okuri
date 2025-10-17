"use client";

import {
    contactDisplay,
    invoiceDisplay,
    projectDisplay,
} from "../mock/display";
import { contactTree, invoiceTree, projectTree } from "../mock/tree";
import { RenderBlock } from "../render";

export const BlockDemo = () => {
    const demos = [
        {
            id: "client-contact",
            title: "Client contact & addresses",
            description:
                "Server-driven display: contact card plus inline owned address list. Linked account rendered via summary fields.",
            tree: contactTree,
            display: contactDisplay,
        },
        {
            id: "project-dashboard",
            title: "Project overview dashboard",
            description:
                "Combines data paths and reference slots to surface project metrics, owner summaries and owned task blocks.",
            tree: projectTree,
            display: projectDisplay,
        },
        {
            id: "invoice-breakdown",
            title: "Invoice breakdown",
            description:
                "Renders totals, client summary and owned line items with conditional notes and action CTA.",
            tree: invoiceTree,
            display: invoiceDisplay,
        },
    ] as const;

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Block Display Gallery</h1>
            <p className="mb-6 text-sm opacity-80">
                Examples of how different payloads and render structures come together inside the
                renderer. Experiment with new component types or bindings by duplicating one of the
                scenarios below.
            </p>

            {demos.map(({ id, title, description, display, tree }) => (
                <section key={id} className="mb-16">
                    <header className="mb-4">
                        <h2 className="text-xl font-semibold">{title}</h2>
                        <p className="text-sm opacity-80">{description}</p>
                    </header>
                    <RenderBlock tree={tree} display={display} />
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        <pre className="bg-background p-3 rounded border overflow-auto">
                            <div className="font-medium mb-2">Display (render model)</div>
                            {JSON.stringify(display, null, 2)}
                        </pre>
                        <pre className="bg-background p-3 rounded border overflow-auto">
                            <div className="font-medium mb-2">BlockTree (data + refs)</div>
                            {JSON.stringify(tree, null, 2)}
                        </pre>
                    </div>
                </section>
            ))}
        </div>
    );
};
