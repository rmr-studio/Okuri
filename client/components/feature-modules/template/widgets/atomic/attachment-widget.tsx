import { FileUpIcon } from "lucide-react";
import { z } from "zod";
import { createWidget } from "../../util/registry";
import { BaseWidget, BaseWidgetProps, WidgetSchema } from "../widget";

export const AttachmentWidgetSchema = WidgetSchema.extend({
    type: z.literal("ATTACHMENT"),
    data: z.object({
        fileName: z.string().min(1).default("document.pdf"),
        fileSize: z.number().min(0).default(1024), // in bytes
        fileType: z.string().default("application/pdf"),
        url: z.string().url().default("https://example.com/document.pdf"),
    }),
});

type Props = z.infer<typeof AttachmentWidgetSchema> & BaseWidgetProps;

const Widget: React.FC<Props> = ({
    id,
    data: { fileName, fileSize, fileType, url },
    onDelete,
    style,
}) => {
    const formatFileSize = (size: number) => {
        if (size < 1024) return `${size} B`;
        else if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
        else if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        else return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    return (
        <BaseWidget id={id} onDelete={onDelete} style={style}>
            <div className="flex flex-col items-start p-4 border rounded-md shadow-sm bg-white h-full">
                <div className="mb-2 text-sm font-medium text-gray-700">{fileName}</div>
                <div className="mb-4 text-xs text-gray-500">
                    {formatFileSize(fileSize)} &middot; {fileType}
                </div>
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                    Download
                </a>
            </div>
        </BaseWidget>
    );
};

export const AttachmentWidget = createWidget({
    type: AttachmentWidgetSchema.shape.type._def.value,
    name: "Attachment",
    description: "A widget to display a file attachment with download link.",
    icon: FileUpIcon,
    schema: AttachmentWidgetSchema,
    component: Widget,
});
