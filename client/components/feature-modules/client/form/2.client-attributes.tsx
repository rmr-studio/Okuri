import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { TextSeparator } from "@/components/ui/text-separator";
import { FC } from "react";
import { toast } from "sonner";
import { RenderClientField } from "./client-field";
import { ClientStepFormProps } from "./client-form";

export const ClientAttributesFormStep: FC<ClientStepFormProps> = ({
    form,
    selectedTemplate,
    handlePreviousPage,
    handleFormSubmit,
}) => {
    const onSubmit = async () => {
        const isValid = await form.trigger();
        if (!isValid) {
            toast.error("Please fix validation errors before submitting");
            return;
        }
        const formValues = form.getValues();
        await handleFormSubmit(formValues);
    };

    return (
        <>
            <CardContent className="space-y-6">
                {selectedTemplate ? (
                    <div>
                        <TextSeparator>
                            <span className="text-sm font-semibold">Custom Attributes</span>
                        </TextSeparator>
                        {Object.entries(selectedTemplate.structure).map(([key, field]) => (
                            <RenderClientField
                                key={key}
                                field={field}
                                form={form}
                                path={`attributes.${key}`}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">
                            No custom attributes template selected. You can still create the client
                            with basic information.
                        </p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between mt-4 py-1 border-t">
                <Button
                    type="button"
                    onClick={() => handlePreviousPage("base")}
                    variant="outline"
                    size="sm"
                    className="cursor-pointer bg-transparent"
                >
                    Previous Page
                </Button>
                <Button type="button" size="sm" className="cursor-pointer" onClick={onSubmit}>
                    Create Organisation
                </Button>
            </CardFooter>
        </>
    );
};
