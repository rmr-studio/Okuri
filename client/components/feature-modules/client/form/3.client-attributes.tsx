import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { TextSeparator } from "@/components/ui/text-separator";
import { FC, useState } from "react";
import { toast } from "sonner";
import { RenderClientField } from "./client-field";
import { ClientStepFormProps } from "./client-form";

export const ClientAttributesFormStep: FC<ClientStepFormProps> = ({
    form,
    selectedTemplate,
    handlePreviousPage,
    handleFormSubmit,
}) => {
    const [extend, setExtend] = useState(false);

    const onSubmit = async () => {
        const isValid = await form.trigger();
        if (!isValid) {
            toast.error("Please fix validation errors before submitting");
            return;
        }
        const formValues = form.getValues();
        await handleFormSubmit(formValues);
    };

    //TODO: Give ability to select a different template at this step
    // TODO: Allow for extension of template with custom attributes => maybe a toggle to "Extend with custom attributes" that reveals the CustomAttributesBuilder component, merging with existing attributes on submit. This should then give the user the option to save their own new template
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

                <div className="flex items-center gap-2 mt-6">
                    <Switch checked={extend} onCheckedChange={setExtend} />
                    <span className="text-sm">Extend with custom attributes</span>
                </div>

                {/* {extend && (
                    <div className="mt-4">
                        <TextSeparator>
                            <span className="text-sm font-semibold">
                                Extended Custom Attributes
                            </span>
                        </TextSeparator>
                        <CustomAttributesBuilder form={form} name="attributes" />
                    </div>
                )} */}
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
                    Create Client
                </Button>
            </CardFooter>
        </>
    );
};
