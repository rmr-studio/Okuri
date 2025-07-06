import React from "react";

type TemplateSelectorProps = {
    templates: Array<{ id: string; name: string }>; // Simplified for now
    selectedTemplateId?: string;
    onSelect: (id: string) => void;
};

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
    templates,
    selectedTemplateId,
    onSelect,
}) => {
    // TODO: Implement template selection UI
    return (
        <div>
            <h4>Select a Template</h4>
            <ul>
                {templates.map((t) => (
                    <li key={t.id}>
                        <button
                            style={{
                                fontWeight:
                                    t.id === selectedTemplateId
                                        ? "bold"
                                        : "normal",
                            }}
                            onClick={() => onSelect(t.id)}
                        >
                            {t.name}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TemplateSelector;
