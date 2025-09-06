import React, { FC, useState } from "react";
import TemplatePreview from "./TemplatePreview";
import { useReportTemplates } from "@/hooks/useReportTemplates";

export type Template = {
    id: string;
    ownerId: string | null;
    name: string;
    type: string;
    templateData: string;
    default: boolean;
    premade: boolean;
};

type Props = {
    userId: string;
    type: string;
    selectedTemplateId?: string;
    onSelect: (id: string) => void;
};

const TemplateSelector: FC<Props> = ({
    userId,
    type,
    selectedTemplateId,
    onSelect,
}) => {
    const [previewTemplate, setPreviewTemplate] = useState<Template | null>(
        null
    );

    const {} = useReportTemplates()

    if (loading) return <div>Loading templates...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h4>Select a Template</h4>
            <ul>
                {templates.map((t) => (
                    <li key={t.id} style={{ marginBottom: 8 }}>
                        <button
                            style={{
                                fontWeight:
                                    t.id === selectedTemplateId
                                        ? "bold"
                                        : "normal",
                                marginRight: 8,
                            }}
                            onClick={() => onSelect(t.id)}
                        >
                            {t.name}
                            {t.default && (
                                <span style={{ marginLeft: 8, color: "green" }}>
                                    (Default)
                                </span>
                            )}
                            {t.premade && (
                                <span style={{ marginLeft: 8, color: "gray" }}>
                                    (Premade)
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setPreviewTemplate(t)}
                            style={{ marginLeft: 4 }}
                        >
                            Preview
                        </button>
                    </li>
                ))}
            </ul>
            {previewTemplate && (
                <div
                    style={{
                        border: "1px solid #aaa",
                        padding: 16,
                        marginTop: 16,
                        background: "#fafafa",
                    }}
                >
                    <button
                        onClick={() => setPreviewTemplate(null)}
                        style={{ float: "right" }}
                    >
                        Close
                    </button>
                    <TemplatePreview
                        templateData={previewTemplate.templateData}
                    />
                </div>
            )}
        </div>
    );
};

export default TemplateSelector;
