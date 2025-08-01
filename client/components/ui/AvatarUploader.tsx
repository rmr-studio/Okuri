import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClassNameProps } from "@/lib/interfaces/interface";
import { cn } from "@/lib/util/utils";
import { Upload } from "lucide-react";
import Image from "next/image";
import { FC, useId, useRef } from "react";

interface InputValidation {
    maxSize: number; // Maximum file size in bytes
    allowedTypes: string[]; // Allowed MIME types
    errorMessage: string; // Error message to display if validation fails
}

interface AvatarUploaderProps extends ClassNameProps {
    onUpload: (file: Blob) => void;
    onRemove?: () => void;
    imageURL?: string;
    title?: string;
    validation: InputValidation;
}

export const AvatarUploader: FC<AvatarUploaderProps> = ({
    onUpload,
    imageURL,
    onRemove,
    title,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const inputId = useId();

    /**
     * Allows File input to be accessed from a Button component
     */
    const uploadFile = () => {
        if (!inputRef.current) return;

        inputRef.current.click();
    };

    const handleFileChangeEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        onUpload(file);
        event.target.value = ""; // Reset input value to allow re-uploading the same file
    };

    return (
        <section className="flex items-center mt-2">
            <div className={cn("mt-2 relative group/picture", imageContainerClass)}>
                <div className="w-20 h-20 relative rounded-xl overflow-hidden">
                    {imageURL ? (
                        <Image
                            alt={title || "Uploaded Avatar Picture"}
                            className=""
                            src={imageURL}
                            fill
                            style={{
                                objectFit: "cover",
                            }}
                        />
                    ) : (
                        <div className="border-2 rounded-xl h-full w-full"></div>
                    )}
                </div>

                <Input
                    ref={inputRef}
                    onChange={handleFileChangeEvent}
                    id={inputId}
                    className="w-full mt-6 absolute hidden"
                    accept="image/*"
                    type="file"
                />
                <label
                    htmlFor={inputId}
                    className="absolute top-0 w-full  h-full  bg-neutral-900/50 dark:bg-neutral-950/70 opacity-0 group-hover/picture:opacity-100 cursor-pointer transition-opacity flex items-center text-center left-0"
                >
                    Upload Picture
                </label>
            </div>

            <div className="ml-4 flex flex-col">
                <Label className="hidden md:block font-semibold">{title}</Label>
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-2">
                    <Button
                        type="button"
                        onClick={uploadFile}
                        variant={"outline"}
                        className={submitButtonClass}
                    >
                        <Upload className="w-4 h-4" />
                        <span>Upload Picture</span>
                    </Button>
                    {onRemove && (
                        <Button type="button" onClick={onRemove} variant={"destructive"}>
                            Remove
                        </Button>
                    )}
                </div>
            </div>
        </section>
    );
};
