import React, { useEffect, useState } from "react";
import TemplateActions from "./TemplateActions";
import TemplatePreview from "./TemplatePreview";

// TODO: Replace with real user context or props
const mockUserId = "11111111-1111-1111-1111-111111111111";
const templateType = "invoice";

export type Template = {
    id: string;
    ownerId: string | null;
    name: string;
    type: string;
    templateData: string;
    isDefault: boolean;
    isBuiltIn: boolean;
};

const TemplateList: React.FC = () => {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(
        null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/report-templates?userId=${mockUserId}&type=${templateType}`)
            .then((res) => res.json())
            .then(setTemplates)
            .catch(() => setError("Failed to load templates"))
            .finally(() => setLoading(false));
    }, []);

    const handlePreview = (template: Template) => setSelectedTemplate(template);
    const handleClosePreview = () => setSelectedTemplate(null);

    // Placeholder action handlers
    const handleEdit = (template: Template) => alert(`Edit ${template.name}`);
    const handleDelete = (template: Template) =>
        alert(`Delete ${template.name}`);
    const handleDuplicate = (template: Template) =>
        alert(`Duplicate ${template.name}`);
    const handleSetDefault = (template: Template) =>
        alert(`Set ${template.name} as default`);

    if (loading) return <div>Loading templates...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h2>Templates</h2>
            {templates.length === 0 && <div>No templates found.</div>}
            <ul>
                {templates.map((template) => (
                    <li
                        key={template.id}
                        style={{
                            marginBottom: 16,
                            border: "1px solid #eee",
                            padding: 8,
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div>
                                <strong>{template.name}</strong>
                                {template.isDefault && (
                                    <span
                                        style={{
                                            marginLeft: 8,
                                            color: "green",
                                        }}
                                    >
                                        (Default)
                                    </span>
                                )}
                                {template.isBuiltIn && (
                                    <span
                                        style={{ marginLeft: 8, color: "gray" }}
                                    >
                                        (Built-in)
                                    </span>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => handlePreview(template)}>
                                    Preview
                                </button>
                                <TemplateActions
                                    onEdit={() => handleEdit(template)}
                                    onDelete={() => handleDelete(template)}
                                    onDuplicate={() =>
                                        handleDuplicate(template)
                                    }
                                    onSetDefault={() =>
                                        handleSetDefault(template)
                                    }
                                />
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
            {selectedTemplate && (
                <div
                    style={{
                        border: "1px solid #aaa",
                        padding: 16,
                        marginTop: 16,
                        background: "#fafafa",
                    }}
                >
                    <button
                        onClick={handleClosePreview}
                        style={{ float: "right" }}
                    >
                        Close
                    </button>
                    <TemplatePreview
                        templateData={selectedTemplate.templateData}
                    />
                </div>
            )}
        </div>
    );
};

export default TemplateList;
