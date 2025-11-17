"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Settings, Upload } from "lucide-react";
import { FC } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Organisation } from "@/components/feature-modules/organisation/interface/organisation.interface";
import { inviteToOrganisation } from "@/components/feature-modules/organisation/service/organisation.service";
import { useAuth } from "@/components/provider/auth-context";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useOrganisationRole } from "@/hooks/useOrganisationRole";

// Validation schema
const inviteSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;
interface Props {
    organisation: Organisation;
}

const InviteMemberForm: FC<Props> = ({ organisation }) => {
    const { session } = useAuth();
    const { hasRole } = useOrganisationRole();
    const queryClient = useQueryClient();

    const form = useForm<InviteFormData>({
        resolver: zodResolver(inviteSchema),
        defaultValues: {
            role: "MEMBER",
            email: "",
        },
    });

    const inviteMutation = useMutation({
        mutationFn: (values: InviteFormData) =>
            inviteToOrganisation(session, {
                organisationId: organisation.id,
                ...values,
            }),
        onSuccess: () => {
            toast.success("Invitation sent!");
            form.reset();
            queryClient.invalidateQueries({ queryKey: ["organisation", organisation.id] });
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to send invite");
        },
    });

    const onInvite = (values: InviteFormData) => {
        if (!session) return;
        inviteMutation.mutate(values);
    };

    return (
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onInvite)} className="space-y-4">
                    {/* Top row: email input + role select + invite button */}
                    <div className="flex gap-3 items-center">
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input placeholder="Add emails..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger className="w-32">
                                            <SelectValue placeholder="Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MEMBER">Member</SelectItem>
                                            {hasRole("ADMIN") && (
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button
                            type="submit"
                            className=" min-w-[100px]"
                            disabled={inviteMutation.isPending}
                        >
                            Invite
                        </Button>
                    </div>

                    {/* Secondary actions */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <Button
                            variant="link"
                            className="p-0 h-auto flex items-center"
                            type="button"
                        >
                            <Settings className="w-4 h-4 mr-1" />
                            Personalize your invitation
                        </Button>
                        <Button
                            variant="link"
                            className="p-0 h-auto flex items-center"
                            type="button"
                        >
                            <Upload className="w-4 h-4 mr-1" />
                            Upload CSV
                        </Button>
                        <Button
                            variant="link"
                            className="p-0 h-auto flex items-center"
                            type="button"
                        >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy invitation link
                        </Button>
                        <div className="flex items-center gap-2 ml-auto">
                            <span>Import from:</span>
                            <div className="flex gap-2">
                                {/* Replace with actual icons */}
                                <div className="w-6 h-6 rounded bg-muted" />
                                <div className="w-6 h-6 rounded bg-muted" />
                                <div className="w-6 h-6 rounded bg-muted" />
                            </div>
                        </div>
                    </div>
                </form>
            </Form>
        </CardContent>
    );
};

export default InviteMemberForm;
