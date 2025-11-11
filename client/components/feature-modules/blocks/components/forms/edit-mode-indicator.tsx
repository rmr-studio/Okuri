"use client";

import { FC, useState } from "react";
import { useBlockEdit } from "../../context/block-edit-provider";
import { AlertCircle, Edit3, Lock, Check, X } from "lucide-react";
import { cn } from "@/lib/util/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export const EditModeIndicator: FC = () => {
    const { getEditingCount, hasUnsavedChanges, saveAllEdits, discardAllEdits } = useBlockEdit();
    const editingCount = getEditingCount();
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveAll = async () => {
        setIsSaving(true);
        const success = await saveAllEdits();
        setIsSaving(false);
        if (!success) {
            // Show error feedback if needed
            console.error("Failed to save all edits due to validation errors");
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

                    <div className="flex items-center gap-2 text-sm">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Movement disabled</span>
                    </div>

                    {hasUnsavedChanges() && (
                        <>
                            <div className="h-4 w-px bg-primary-foreground/30" />
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-3.5 w-3.5 text-yellow-300" />
                                <span className="text-sm text-yellow-300">Unsaved changes</span>
                            </div>
                        </>
                    )}

                    <div className="h-4 w-px bg-primary-foreground/30" />

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
                            onClick={handleSaveAll}
                            disabled={isSaving}
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {isSaving ? "Saving..." : "Save All"}
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 px-3 text-xs bg-white/20 hover:bg-white/30 text-primary-foreground border-0"
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
