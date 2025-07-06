import React from "react";

type TemplateActionsProps = {
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onSetDefault: () => void;
};

const TemplateActions: React.FC<TemplateActionsProps> = ({
    onEdit,
    onDelete,
    onDuplicate,
    onSetDefault,
}) => {
    return (
        <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onEdit}>Edit</button>
            <button onClick={onDelete}>Delete</button>
            <button onClick={onDuplicate}>Duplicate</button>
            <button onClick={onSetDefault}>Set Default</button>
        </div>
    );
};

export default TemplateActions;
