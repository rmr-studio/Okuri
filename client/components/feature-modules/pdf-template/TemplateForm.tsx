import React, { useState } from "react";

type TemplateFormProps = {
    initialData?: {
        name: string;
        type: string;
        templateData: string;
    };
    onSubmit: (data: {
        name: string;
        type: string;
        templateData: string;
    }) => void;
    onCancel?: () => void;
};

const TEMPLATE_TYPES = [
    { value: "invoice", label: "Invoice" },
    { value: "report", label: "Report" },
];

const TemplateForm: React.FC<TemplateFormProps> = ({
    initialData,
    onSubmit,
    onCancel,
}) => {
    const [name, setName] = useState(initialData?.name || "");
    const [type, setType] = useState(
        initialData?.type || TEMPLATE_TYPES[0].value
    );
    const [templateData, setTemplateData] = useState(
        initialData?.templateData || ""
    );
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError("Name is required");
            return;
        }
        if (!templateData.trim()) {
            setError("Template data is required");
            return;
        }
        setError(null);
        setSubmitting(true);
        onSubmit({ name, type, templateData });
        setSubmitting(false);
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{ maxWidth: 500, margin: "0 auto" }}
        >
            <h3>{initialData ? "Edit Template" : "Create Template"}</h3>
            <div style={{ marginBottom: 12 }}>
                <label>
                    Name:
                    <br />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={{ width: "100%" }}
                    />
                </label>
            </div>
            <div style={{ marginBottom: 12 }}>
                <label>
                    Type:
                    <br />
                    <select
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        style={{ width: "100%" }}
                    >
                        {TEMPLATE_TYPES.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div style={{ marginBottom: 12 }}>
                <label>
                    Template Data (JSON or text):
                    <br />
                    <textarea
                        value={templateData}
                        onChange={(e) => setTemplateData(e.target.value)}
                        rows={8}
                        style={{ width: "100%", fontFamily: "monospace" }}
                        required
                    />
                </label>
            </div>
            {error && (
                <div style={{ color: "red", marginBottom: 12 }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
                <button type="submit" disabled={submitting}>
                    {initialData ? "Update" : "Create"}
                </button>
                {onCancel && (
                    <button type="button" onClick={onCancel}>
                        Cancel
                    </button>
                )}
            </div>
        </form>
    );
};

export default TemplateForm;
