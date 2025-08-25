import { useAuth } from "@/components/provider/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { updateLineItem } from "@/controller/lineitem.controller";
import { useLineItemOverview } from "@/hooks/useLineItemOverview";
import { useOrganisation } from "@/hooks/useOrganisation";
import { LineItem } from "@/lib/interfaces/invoice.interface";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import EditLineItem from "./EditLineItem";
import { LineItemCreation } from "./LineItemForm";
import { LineItemOverviewSkeleton } from "./loading/LineItemOverviewSkeleton";

const LineItemOverview = () => {
    const { data: item, isLoading: isLoadingItem, error, isLoadingAuth } = useLineItemOverview();
    const { session, client: authClient } = useAuth();
    const { data: organisation, isLoading: isLoadingOrganisation } = useOrganisation();
    const [editingItem, setEditingItem] = useState<boolean>(false);
    const toastRef = useRef<string | number | undefined>(undefined);
    const queryClient = useQueryClient();
    const router = useRouter();

    const handleDrawerClose = () => {
        setEditingItem(false);
    };

    const handleItemEdit = async (itemDetails: LineItemCreation) => {
        // Handle mutation
        if (!session || !authClient || !item || !organisation) return;

        if (organisation.id !== item.organisationId) {
            toast.error("You do not have permission to edit this item.");
            router.push("/dashboard/item");
        }

        const updatedLineItem: LineItem = {
            ...item,
            name: itemDetails.name,
            description: itemDetails.description,
            chargeRate: itemDetails.chargeRate,
            type: itemDetails.type,
        };

        itemMutation.mutate(updatedLineItem);
        handleDrawerClose();
    };

    const itemMutation = useMutation({
        mutationFn: (item: LineItem) => updateLineItem(session, item),
        // Optimistic update
        onMutate: async (updatedLineItem) => {
            if (!item) return;

            // Cancel any outgoing refetches to avoid overwriting the optimistic update
            await queryClient.cancelQueries({
                queryKey: ["item", item.id],
            });

            // Snapshot the previous value
            const previousItem = queryClient.getQueryData<LineItem>(["item", item.id]);

            // Optimistically update the cache
            queryClient.setQueryData(["item", item.id], updateLineItem);

            // Start the toast
            toastRef.current = toast.loading("Editing Item Details...");

            // Return context for rollback on error
            return { previousItem };
        },
        onSuccess: (data) => {
            toast.dismiss(toastRef.current);
            toast.success("Item updated successfully");

            // Ensure the cache is updated with the server response
            queryClient.setQueryData(["item", data.id], data);
        },
        onError: (error, _variables, context) => {
            // Roll back to the previous data on error
            queryClient.setQueryData(["item", item?.id], context?.previousItem);
            toast.dismiss(toastRef.current);
            toast.error(`Failed to update item: ${error.message}`);
        },
        // Always refetch after error or success to ensure data consistency (optional)
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["item", item?.id] });
        },
    });

    useEffect(() => {
        // Redirect if not authenticated or organisation not loaded
        if (!session || (!organisation && !isLoadingOrganisation)) {
            toast.error(
                "Failed to authenticate current user, or selected organisation. Please log in again."
            );
            router.push("/login");
            return;
        }

        // Redirect if user is trying to access an item from a different organisation
        if (item && organisation && item.organisationId !== organisation.id) {
            toast.error("You do not have permission to view this item.");
            router.push("/dashboard/item");
            return;
        }

        // If item is not found, redirect to item list
        if (!item && !isLoadingItem) {
            router.push("/dashboard/item");
        }
    }, [organisation, item, session]);

    // Show loading state while authentication or data is loading
    if (isLoadingAuth || isLoadingItem || isLoadingOrganisation) {
        return <LineItemOverviewSkeleton />;
    }

    // Show error state
    if (error) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Failed to load item information. Please try again later.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Show not found state
    if (!item) {
        return (
            <div className="container mx-auto p-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Item not found.</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <>
            <div></div>
            {editingItem && (
                <EditLineItem item={item} onSubmit={handleItemEdit} onClose={handleDrawerClose} />
            )}
        </>
    );
};

export default LineItemOverview;
