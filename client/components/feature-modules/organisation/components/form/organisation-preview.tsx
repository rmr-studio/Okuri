import { FC } from "react";
import { OrganisationFormDetails } from "./organisation-form";

interface Props {
    data: OrganisationFormDetails;
}

export const OrganisationFormPreview: FC<Props> = ({ data: organisation }) => {
    // TODO: Implemet dynamic preview of organisation form
    return (
        <>
            <h2 className="text-lg font-semibold">Organisation Preview</h2>
            <div>
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                    Basic Information
                </h3>
                <div className="space-y-2">
                    <div>
                        <span className="text-sm font-medium">Name:</span>
                        <p className="text-sm text-muted-foreground">
                            {organisation.displayName || "Not specified"}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
};
