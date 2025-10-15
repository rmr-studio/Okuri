import { AvatarUploader } from "@/components/ui/AvatarUploader";
import { Button } from "@/components/ui/button";
import { CardContent, CardFooter } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CurrencySelector } from "@/components/ui/forms/currency/form-currency-picker";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { SquareArrowUpRight } from "lucide-react";
import Link from "next/link";
import { FC } from "react";
import { toast } from "sonner";
import { OrganisationStepFormProps } from "./organisation-form";

const OrganisationDetailsForm: FC<OrganisationStepFormProps> = ({
    setUploadedAvatar,
    form,
    handleNextPage,
}) => {
    const handleAvatarUpload = (file: Blob): void => {
        // Store transformed image ready for upload upon form submission
        setUploadedAvatar(file);
        // Set the avatar URL in the form state
        const avatarURL = URL.createObjectURL(file);
        form.setValue("avatarUrl", avatarURL);
        URL.revokeObjectURL(avatarURL); // Clean up the object URL
    };

    const handleAvatarRemoval = (): void => {
        setUploadedAvatar(null);
        form.setValue("avatarUrl", undefined);
    };

    const onNext = async () => {
        // Handle internal validation for all fields specific to this step
        const isValid = await form.trigger(["displayName", "defaultCurrency", "plan"]);
        if (!isValid) {
            toast.error("Some fields are missing required values");
            return;
        }

        // If valid, proceed to the next step
        handleNextPage("billing");
    };

    return (
        <>
            <CardContent className="pb-8">
                <h3 className="text-lg font-semibold mb-1">Organisation Overview</h3>
                <p className="text-sm text-muted-foreground mb-2">
                    Provide some basic information about your organisation. You can update these
                    details later in your organisation settings.
                </p>
                <div className="flex flex-col space-y-6 mb-8">
                    <FormField
                        control={form.control}
                        name="avatarUrl"
                        render={(_) => (
                            <FormItem className="flex flex-col lg:flex-row w-full">
                                <FormLabel className="w-1/3">Organisation Avatar</FormLabel>
                                <AvatarUploader
                                    onUpload={handleAvatarUpload}
                                    imageURL={form.getValues("avatarUrl")}
                                    onRemove={handleAvatarRemoval}
                                    validation={{
                                        maxSize: 5 * 1024 * 1024, // 5MB
                                        allowedTypes: ["image/jpeg", "image/png", "image/webp"],
                                        errorMessage:
                                            "Please upload a valid image file (JPEG, PNG, WebP) under 5MB",
                                    }}
                                />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="displayName"
                        render={({ field }) => (
                            <>
                                <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                    <FormLabel className="w-1/3" htmlFor="displayName">
                                        Organisation Name *
                                    </FormLabel>
                                    <div className="w-auto flex-grow">
                                        <Input
                                            id="displayName"
                                            placeholder="My Organisation"
                                            className="w-full"
                                            {...field}
                                            required
                                        />
                                        <FormMessage className="text-xs mt-2 ml-1" />
                                    </div>
                                </FormItem>
                            </>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="defaultCurrency"
                        render={({ field }) => (
                            <>
                                <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                    <FormLabel className="w-1/3" htmlFor="defaultCurrency">
                                        Default Currency *
                                    </FormLabel>
                                    <CurrencySelector
                                        className="w-auto flex-grow"
                                        value={field.value}
                                        onChange={(value) => {
                                            field.onChange(value);
                                        }}
                                    />
                                </FormItem>
                                <FormMessage />
                            </>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="plan"
                        render={({ field }) => (
                            <>
                                <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                    <div className="w-full lg:w-1/3 mt-2">
                                        <FormLabel className="w-1/3" htmlFor="plan">
                                            Organisation Plan *
                                        </FormLabel>
                                        <Link
                                            href={"/pricing"}
                                            target="_blank"
                                            className="text-xs text-content flex items-center w-fit h-fit mt-2 hover:opacity-50 transition-opacity"
                                        >
                                            Pricing
                                            <SquareArrowUpRight className="w-3 h-3 ml-1" />
                                        </Link>
                                    </div>
                                    <Select
                                        defaultValue={field.value}
                                        onValueChange={field.onChange}
                                    >
                                        <FormControl className="flex flex-grow w-auto mt-2">
                                            <SelectTrigger className="w-full lg:w-auto">
                                                <SelectValue placeholder="Select an organisation plan" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem
                                                value="FREE"
                                                className="flex justify-between"
                                            >
                                                <span>Free</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    - $0/month
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="STARTUP">
                                                <span>Startup</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    - $10/month
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="SCALE">
                                                <span>Scale</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    - $25/month
                                                </span>
                                            </SelectItem>
                                            <SelectItem value="ENTERPRISE">
                                                <span>Enterprise</span>
                                                <span className="text-xs text-muted-foreground ml-2">
                                                    - Custom pricing
                                                </span>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                                <FormMessage />
                            </>
                        )}
                    />
                </div>
                <h3 className="text-lg font-semibold mb-1">Business Registration Information</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Providing your business registration details helps us verify your organisation
                    and ensures compliance with local regulations. This information is kept secure
                    and confidential.
                </p>
                <div className="flex flex-col space-y-6 mb-6">
                    <FormField
                        control={form.control}
                        name="businessNumber"
                        render={({ field }) => (
                            <>
                                <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                    <FormLabel className="w-1/3" htmlFor="businessNumber">
                                        Business Registration Number *
                                    </FormLabel>
                                    <div className="w-auto flex-grow">
                                        <Input
                                            id="businessNumber"
                                            placeholder="xx xxx xxx xxx"
                                            className="w-full"
                                            {...field}
                                            required
                                        />
                                        <FormMessage className="text-xs mt-2 ml-1" />
                                    </div>
                                </FormItem>
                            </>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="taxId"
                        render={({ field }) => (
                            <>
                                <FormItem className="flex mt-2 flex-col lg:flex-row w-full">
                                    <FormLabel className="w-1/3" htmlFor="taxId">
                                        Tax Registration Number
                                    </FormLabel>
                                    <div className="w-auto flex-grow">
                                        <Input
                                            id="taxId"
                                            placeholder="xxx xxx xxx"
                                            className="w-full"
                                            {...field}
                                            required
                                        />
                                        <FormMessage className="text-xs mt-2 ml-1" />
                                    </div>
                                </FormItem>
                            </>
                        )}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex justify-end mt-4 py-1 border-t ">
                <Button type="button" size={"sm"} className="cursor-pointer" onClick={onNext}>
                    Next Page
                </Button>
            </CardFooter>
        </>
    );
};

export default OrganisationDetailsForm;
