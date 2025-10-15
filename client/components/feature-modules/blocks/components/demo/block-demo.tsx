import { display } from "../mock/display";
import { tree } from "../mock/tree";
import { RenderBlock } from "../render";

export const BlockDemo = () => {
    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Block Display Demo</h1>
            <p className="mb-6 text-sm opacity-80">
                Server-driven display (V1): contact card + owned address list. Linked account
                rendered via summary.
            </p>

            <RenderBlock tree={tree} display={display} />

            <div className="mt-10 grid grid-cols-2 gap-6 text-xs">
                <pre className="bg-background p-3 rounded border overflow-auto">
                    <div className="font-medium mb-2">Display (render model)</div>
                    {JSON.stringify(display, null, 2)}
                </pre>
                <pre className="bg-background p-3 rounded border overflow-auto">
                    <div className="font-medium mb-2">BlockTree (data + refs)</div>
                    {JSON.stringify(tree, null, 2)}
                </pre>
            </div>
        </div>
    );
};
