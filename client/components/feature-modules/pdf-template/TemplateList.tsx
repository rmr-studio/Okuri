import React, { useEffect, useState } from "react";
import TemplateActions from "./TemplateActions";
import TemplateForm from "./TemplateForm";
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
    const [showForm, setShowForm] = useState(false);
    const [formInitialData, setFormInitialData] = useState<any>(null);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
        null
    );

    const fetchTemplates = () => {
        setLoading(true);
        fetch(`/api/report-templates?userId=${mockUserId}&type=${templateType}`)
            .then((res) => res.json())
            .then(setTemplates)
            .catch(() => setError("Failed to load templates"))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const handlePreview = (template: Template) => setSelectedTemplate(template);
    const handleClosePreview = () => setSelectedTemplate(null);

    const handleEdit = (template: Template) => {
        setFormInitialData({
            name: template.name,
            type: template.type,
            templateData: template.templateData,
        });
        setEditingTemplateId(template.id);
        setShowForm(true);
    };

    const handleCreate = () => {
        setFormInitialData(null);
        setEditingTemplateId(null);
        setShowForm(true);
    };

    const handleFormSubmit = async (data: {
        name: string;
        type: string;
        templateData: string;
    }) => {
        if (editingTemplateId) {
            // Update existing
            await fetch(`/api/report-templates/${editingTemplateId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingTemplateId,
                    ownerId: mockUserId,
                    ...data,
                    isDefault: false,
                    isBuiltIn: false,
                }),
            });
        } else {
            // Create new
            await fetch("/api/report-templates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: crypto.randomUUID(),
                    ownerId: mockUserId,
                    ...data,
                    isDefault: false,
                    isBuiltIn: false,
                }),
            });
        }
        setShowForm(false);
        setEditingTemplateId(null);
        setFormInitialData(null);
        fetchTemplates();
    };

    const handleDelete = async (template: Template) => {
        if (!window.confirm(`Delete template "${template.name}"?`)) return;
        await fetch(`/api/report-templates/${template.id}`, {
            method: "DELETE",
        });
        fetchTemplates();
    };

    const handleDuplicate = async (template: Template) => {
        await fetch("/api/report-templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...template,
                id: crypto.randomUUID(),
                name: template.name + " (Copy)",
                isDefault: false,
                isBuiltIn: false,
            }),
        });
        fetchTemplates();
    };

    const handleSetDefault = async (template: Template) => {
        // Set all user's templates of this type to isDefault: false, then set this one to true
        await Promise.all(
            templates
                .filter(
                    (t) => t.ownerId === mockUserId && t.type === template.type
                )
                .map((t) =>
                    fetch(`/api/report-templates/${t.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...t,
                            isDefault: t.id === template.id,
                        }),
                    })
                )
        );
        fetchTemplates();
    };

    if (loading) return <div>Loading templates...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div>
            <h2>Templates</h2>
            <button onClick={handleCreate} style={{ marginBottom: 16 }}>
                + New Template
            </button>
            {showForm && (
                <div
                    style={{
                        border: "1px solid #aaa",
                        padding: 16,
                        marginBottom: 16,
                        background: "#fafafa",
                    }}
                >
                    <TemplateForm
                        initialData={formInitialData}
                        onSubmit={handleFormSubmit}
                        onCancel={() => {
                            setShowForm(false);
                            setEditingTemplateId(null);
                            setFormInitialData(null);
                        }}
                    />
                </div>
            )}
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
