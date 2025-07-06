import React from "react";

type TemplatePreviewProps = {
    templateData: string;
};

const TemplatePreview: React.FC<TemplatePreviewProps> = ({ templateData }) => {
    // TODO: Render a preview of the template
    return (
        <div>
            <h3>Template Preview</h3>
            <pre>{templateData}</pre>
        </div>
    );
};

export default TemplatePreview;
