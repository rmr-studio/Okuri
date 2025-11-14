"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/util/utils";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Edit3, Layout, X } from "lucide-react";
import { FC, useState } from "react";
import { useBlockEdit } from "../../context/block-edit-provider";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useLayoutChange } from "../../context/layout-change-provider";

export const EditModeIndicator: FC = () => {
    const { getEditingCount, hasUnsavedChanges, saveAllEdits, discardAllEdits } = useBlockEdit();
    const { isInitialized } = useBlockEnvironment();
    const {
        hasLayoutChanges,
        layoutChangeCount,
        saveLayoutChanges,
        discardLayoutChanges,
        canDiscard,
        saveStatus,
    } = useLayoutChange();

    const editingCount = getEditingCount();
    const hasDataChanges = hasUnsavedChanges();
    const hasLayout = hasLayoutChanges();
    const totalChanges = editingCount + (hasLayout ? 1 : 0);
    const discardAllowed = canDiscard();

    const [isSaving, setIsSaving] = useState(false);

    // Don't show indicator during initialization to prevent false positives
    // from widget sync operations
    const shouldShow = isInitialized && totalChanges > 0;

    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            let allSuccess = true;

            // 1. Save block data edits (existing functionality)
            if (hasDataChanges) {
                const dataSuccess = await saveAllEdits();
                if (!dataSuccess) {
                    console.error("Failed to save block data edits");
                    allSuccess = false;
                }
            }

            // 2. Save layout changes (new functionality)
            if (hasLayout && allSuccess) {
                const layoutSuccess = await saveLayoutChanges();
                if (!layoutSuccess) {
                    console.error("Failed to save layout changes");
                    allSuccess = false;
                }
            }

            if (allSuccess) {
                console.log("✅ All changes saved successfully");
            }
        } catch (error) {
            console.error("Error saving all changes:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscardAll = () => {
        // Discard block data edits
        if (hasDataChanges) {
            discardAllEdits();
        }

        // Discard layout changes
        if (hasLayout) {
            discardLayoutChanges();
            // This will work.... last resort
            // setTimeout(() => {
            //     discardLayoutChanges();
            // }, 1);
        }

        console.log("🔄 All changes discarded");
    };

    return (
        <AnimatePresence>
            {shouldShow && (
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
                    {/* Status indicators */}
                    <div className="flex items-center gap-2">
                        {editingCount > 0 && (
                            <>
                                <Edit3 className="h-4 w-4" />
                                <span className="font-medium">
                                    {editingCount} block{editingCount !== 1 ? "s" : ""} editing
                                </span>
                            </>
                        )}
                        {editingCount > 0 && hasLayout && (
                            <span className="text-primary-foreground/60">•</span>
                        )}
                        {hasLayout && (
                            <>
                                <Layout className="h-4 w-4" />
                                <span className="font-medium">Layout modified</span>
                            </>
                        )}
                    </div>

                    {(hasDataChanges || hasLayout) && (
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
                            disabled={isSaving || saveStatus === "saving"}
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {isSaving || saveStatus === "saving" ? "Saving..." : "Save All"}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="bg-destructive/50"
                            onClick={handleDiscardAll}
                            disabled={isSaving || saveStatus === "saving" || !discardAllowed}
                            title={
                                !discardAllowed
                                    ? "Cannot discard: blocks were added, removed, or re-parented. Please save changes or refresh the page."
                                    : "Discard all unsaved changes"
                            }
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
