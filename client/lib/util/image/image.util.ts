import { ChangeEvent } from "react";

interface UploadHelperCallbacks {
    handleUpload: (file: File) => Promise<void>;
}

export const imageUploadHelper = ({ handleUpload }: UploadHelperCallbacks) => {
    return async (event: ChangeEvent<HTMLInputElement>) => {
        // No Files have been provided
        if (!event.target.files || event.target.files.length === 0) {
            //todo: Handle Errors
            return;
        }

        // Retrieve Uploaded File and handle uploading process
        const file = event.target.files[0];
        try {
            await handleUpload(file);
        } finally {
            // Allow re-selecting the same file
            event.target.value = "";
        }
    };
};
