"use client";

import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { useReportTemplates } from "@/hooks/useReportTemplates";
import { useEffect, useState } from "react";
import TemplateActions from "./TemplateActions";
import TemplateForm from "./TemplateForm";
import TemplatePreview from "./TemplatePreview";

const templateType = "invoice";

const TemplateList = () => {
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [formInitialData, setFormInitialData] = useState<any>(null);
    const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

    const { data: user, isLoadingAuth } = useProfile();
    const {
        data: templates = [],
        isLoading,
        error: fetchError,
        refetch,
    } = useReportTemplates(user?.id ?? null, templateType);

    useEffect(() => {
        refetch();
    }, [user?.id, templateType, refetch]);

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

    const handleFormSubmit = async (data: { name: string; type: string; templateData: string }) => {
        if (editingTemplateId) {
            // Update existing
            await fetch(`/api/report-templates/${editingTemplateId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingTemplateId,
                    ownerId: user?.id,
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
                    ownerId: user?.id,
                    ...data,
                    isDefault: false,
                    isBuiltIn: false,
                }),
            });
        }
        setShowForm(false);
        setEditingTemplateId(null);
        setFormInitialData(null);
        refetch();
    };

    const handleDelete = async (template: Template) => {
        if (!window.confirm(`Delete template "${template.name}"?`)) return;
        await fetch(`/api/report-templates/${template.id}`, {
            method: "DELETE",
        });
        refetch();
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
        refetch();
    };

    const handleSetDefault = async (template: Template) => {
        // Set all user's templates of this type to isDefault: false, then set this one to true
        await Promise.all(
            templates
                .filter((t: Template) => t.ownerId === user?.id && t.type === template.type)
                .map((t: Template) =>
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
        refetch();
    };

    if (isLoadingAuth || isLoading) return <div>Loading templates...</div>;
    if (fetchError) return <div>{(fetchError as Error).message}</div>;

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
                                    <span style={{ marginLeft: 8, color: "gray" }}>(Built-in)</span>
                                )}
                            </div>
                            <div style={{ display: "flex", gap: 8 }}>
                                <button onClick={() => handlePreview(template)}>Preview</button>
                                <TemplateActions
                                    onEdit={() => handleEdit(template)}
                                    onDelete={() => handleDelete(template)}
                                    onDuplicate={() => handleDuplicate(template)}
                                    onSetDefault={() => handleSetDefault(template)}
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
                    <button onClick={handleClosePreview} style={{ float: "right" }}>
                        Close
                    </button>
                    <TemplatePreview templateData={selectedTemplate.templateData} />
                </div>
            )}
        </div>
    );
};

export default TemplateList;
