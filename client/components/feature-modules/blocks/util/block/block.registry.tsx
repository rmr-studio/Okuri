/**
 * Registry describing every block component that can be rendered.
 *
 * Each entry defines the runtime component, a Zod schema for validating props,
 * and metadata used by authoring tools.
 */
import { createRenderElement } from "@/components/feature-modules/render/util/render-element.registry";
import React, { ComponentType as Component } from "react";
import { z } from "zod";
import { AddressCard } from "../../components/bespoke/AddressCard";
import { ContactCard } from "../../components/bespoke/ContactCard";
import { ButtonBlock } from "../../components/primitive/block.button";
import { LayoutContainerBlock } from "../../components/primitive/block.container";
import { ListBlock } from "../../components/primitive/block.list";
import { DataSummaryTable } from "../../components/primitive/block.table";
import { TextBlock } from "../../components/primitive/block.text";

const ContactCardSchema = z
    .object({
        client: z.any().optional(),
        accounts: z.array(z.any()).optional(),
        href: z.string().optional(),
        avatarUrl: z.string().nullable().optional(),
        avatarShape: z.enum(["circle", "square"]).optional(),
        slots: z.record(z.any()).optional(),
    })
    .passthrough();

const AddressCardSchema = z
    .object({
        address: z
            .object({
                street: z.string().optional(),
                city: z.string().optional(),
                state: z.string().optional(),
                postalCode: z.string().optional(),
                country: z.string().optional(),
            })
            .partial()
            .optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        footer: z.any().optional(),
        slots: z.record(z.any()).optional(),
    })
    .passthrough();

const DataSummaryTableSchema = z
    .object({
        title: z.string().optional(),
        description: z.string().optional(),
        data: z.any().optional(),
        className: z.string().optional(),
    })
    .passthrough();

const ImageBlockSchema = z
    .object({
        src: z.string().nonempty(),
        alt: z.string().optional(),
        className: z.string().optional(),
    })
    .passthrough();

const AttachmentSchema = z
    .object({
        children: z.any().optional(),
    })
    .passthrough();

export const FallbackComponent: React.FC<{ reason?: string }> = ({ reason }) => (
    <div className="rounded border p-3 text-sm opacity-70">
        Unsupported component{reason ? `: ${reason}` : ""}
    </div>
);

const FallbackSchema = z.object({
    reason: z.string().optional(),
});

const baseBlockElements = {
    CONTACT_CARD: createRenderElement({
        type: "CONTACT_CARD",
        name: "Contact card",
        description: "Displays primary client information with linked account summary.",
        category: "BLOCK",
        schema: ContactCardSchema,
        component: ContactCard,
    }),
    ADDRESS_CARD: createRenderElement({
        type: "ADDRESS_CARD",
        name: "Address card",
        description: "Shows postal address details in a compact card.",
        category: "BLOCK",
        schema: AddressCardSchema,
        component: AddressCard,
    }),
    LINE_ITEM: ListBlock,
    TABLE: createRenderElement({
        type: "TABLE",
        name: "Summary table",
        description: "Displays labelled values in a card layout.",
        category: "BLOCK",
        schema: DataSummaryTableSchema,
        component: DataSummaryTable,
    }),
    TEXT: TextBlock,
    IMAGE: createRenderElement({
        type: "IMAGE",
        name: "Image",
        description: "Renders an image with optional styling.",
        category: "BLOCK",
        schema: ImageBlockSchema,
        component: (p: z.infer<typeof ImageBlockSchema>) => (
            <img
                src={p.src}
                alt={p.alt ?? ""}
                className={p.className ?? "rounded-md object-cover max-h-64 w-full"}
            />
        ),
    }),
    BUTTON: ButtonBlock,
    ATTACHMENT: createRenderElement({
        type: "ATTACHMENT",
        name: "Attachment placeholder",
        description: "Container for attachment previews or upload dropzones.",
        category: "BLOCK",
        schema: AttachmentSchema,
        component: (p: z.infer<typeof AttachmentSchema>) => (
            <div className="rounded border border-dashed p-3 text-sm text-muted-foreground">
                {p.children ?? "Attachment placeholder"}
            </div>
        ),
    }),
    LAYOUT_CONTAINER: LayoutContainerBlock,
} as const;

export const blockElements = {
    ...baseBlockElements,
    FALLBACK: createRenderElement({
        type: "FALLBACK",
        name: "Fallback",
        description: "Default component rendered when no mapping exists.",
        category: "SHARED",
        schema: FallbackSchema,
        component: FallbackComponent,
    }),
} as const;

const componentKeys = Object.keys(baseBlockElements);

export const registry: Record<string, Component<any>> = componentKeys.reduce((acc, key) => {
    acc[key] = baseBlockElements[key as keyof typeof baseBlockElements].component;
    return acc;
}, {} as Record<string, Component<any>>);

export const blockRenderRegistry = blockElements;
