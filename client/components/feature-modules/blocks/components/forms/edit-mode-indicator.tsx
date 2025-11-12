"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/util/utils";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Edit3, X } from "lucide-react";
import { FC, useState } from "react";
import { useBlockEdit } from "../../context/block-edit-provider";

export const EditModeIndicator: FC = () => {
    const { getEditingCount, hasUnsavedChanges, saveAllEdits, discardAllEdits } = useBlockEdit();
    const editingCount = getEditingCount();
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            const success = await saveAllEdits();
            if (!success) {
                // Show error feedback if needed
                console.error("Failed to save all edits due to validation errors");
            }
        } catch (error) {
            console.error("Error saving all edits:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscardAll = () => {
        discardAllEdits();
    };

    return (
        <AnimatePresence>
            {editingCount > 0 && (
                <motion.div
                    key="edit-indicator"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={cn(
                        "fixed top-4 left-1/2 -translate-x-1/2 z-50",
                        "flex items-center gap-3 px-4 py-2.5 rounded-lg shadow-lg",
                        "bg-primary text-primary-foreground",
                        "border border-primary-foreground/20"
                    )}
                >
                    <div className="flex items-center gap-2">
                        <Edit3 className="h-4 w-4" />
                        <span className="font-medium">
                            {editingCount} block{editingCount !== 1 ? "s" : ""} in edit mode
                        </span>
                    </div>

                    <div className="h-4 w-px bg-primary-foreground/30" />

                    {hasUnsavedChanges() && (
                        <>
                            <div className="h-4 w-px bg-primary-foreground/30" />
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5 text-edit" />
                                <span className="text-sm text-edit">Unsaved changes</span>
                            </div>
                        </>
                    )}

                    <div className="h-4 w-px bg-primary-foreground/30" />

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleSaveAll}
                            disabled={isSaving}
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {isSaving ? "Saving..." : "Save All"}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="bg-destructive/50"
                            onClick={handleDiscardAll}
                            disabled={isSaving}
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Discard All
                        </Button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
