import { DataSummaryTable as DataSummaryTableComponent } from "@/components/feature-modules/blocks/components/primitive/block.table";
import { RenderElementMetadata } from "@/components/feature-modules/blocks/util/block/block.registry";
import { z } from "zod";

const schema = z
    .object({
        title: z.string().optional(),
        description: z.string().optional(),
        data: z.any().optional(),
        className: z.string().optional(),
    })
    .passthrough();

export const DataSummaryTable: RenderElementMetadata<typeof schema> = {
    type: "TABLE",
    name: "Summary table",
    description: "Displays labelled values in a card layout.",
    schema,
    component: DataSummaryTableComponent,
};

export { DataSummaryTableComponent };
