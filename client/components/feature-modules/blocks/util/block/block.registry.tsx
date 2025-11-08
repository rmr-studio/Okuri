/**
 * Registry describing every block component that can be rendered.
 *
 * Each entry defines the runtime component, a Zod schema for validating props,
 * and metadata used by authoring tools.
 */

import { ComponentType as Component } from "react";
import { z, ZodTypeAny } from "zod";
import { AddressCard } from "../../components/bespoke/AddressCard";
import { AttachmentBlock } from "../../components/bespoke/AttachmentBlock";
import { ContactCard } from "../../components/bespoke/ContactCard";
import { DataSummaryTable } from "../../components/bespoke/DataSummaryTable";
import { FallbackBlock } from "../../components/bespoke/FallbackBlock";
import { ImageBlock } from "../../components/bespoke/ImageBlock";
import { ButtonBlock } from "../../components/primitive/block.button";
import { LayoutContainerBlock } from "../../components/primitive/block.container";
import { ListBlock } from "../../components/primitive/block.list";
import { TextBlock } from "../../components/primitive/block.text";
import { ComponentType } from "../../interface/block.interface";

export interface RenderElementMetadata<T extends ZodTypeAny> {
    type: string;
    name?: string;w
    description?: string;
    icon?: Component<any>;
    schema: T;
    component: Component<z.infer<T>>;
}

type BlockElementMap = Record<string, RenderElementMetadata<ZodTypeAny>>;

const baseBlockElements: Record<ComponentType, RenderElementMetadata<ZodTypeAny>> = {   
    CONTACT_CARD: ContactCard,
    ADDRESS_CARD: AddressCard,
    LINE_ITEM: ListBlock,
    TABLE: DataSummaryTable,
    TEXT: TextBlock,
    IMAGE: ImageBlock,
    BUTTON: ButtonBlock,
    ATTACHMENT: AttachmentBlock,
    LAYOUT_CONTAINER: LayoutContainerBlock,
} satisfies BlockElementMap;

export const blockElements = {
    ...baseBlockElements,
    FALLBACK: FallbackBlock,
} satisfies BlockElementMap;

const componentKeys = Object.keys(baseBlockElements);

export const registry: Record<string, Component<any>> = componentKeys.reduce((acc, key) => {
    acc[key] = baseBlockElements[key as keyof typeof baseBlockElements].component;
    return acc;
}, {} as Record<string, Component<any>>);

export const isValidBlockType = (type: string): type is ComponentType => {
    return componentKeys.includes(type);
};

export const blockRenderRegistry = blockElements;
