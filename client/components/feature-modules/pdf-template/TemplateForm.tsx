import React from "react";

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
};

const TemplateForm: React.FC<TemplateFormProps> = ({
    initialData,
    onSubmit,
}) => {
    // TODO: Implement form logic
    return (
        <form
            onSubmit={(e) => {
                e.preventDefault(); /* handle submit */
            }}
        >
            <h3>{initialData ? "Edit Template" : "Create Template"}</h3>
            {/* Form fields will go here */}
        </form>
    );
};

export default TemplateForm;
