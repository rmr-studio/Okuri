"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/util/utils";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Check, Edit3, FileEdit, Layout, X } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { useBlockEdit } from "../../context/block-edit-provider";
import { useBlockEnvironment } from "../../context/block-environment-provider";
import { useLayoutChange } from "../../context/layout-change-provider";
import { useLayoutHistory } from "../../context/layout-history-provider";
import { useLayoutKeyboardShortcuts } from "../../hooks/use-layout-keyboard-shortcuts";

export const EditModeIndicator: FC = () => {
    const { getEditingCount, hasUnsavedChanges, saveAllEdits, discardAllEdits } = useBlockEdit();
    const { isInitialized } = useBlockEnvironment();
    const {
        hasLayoutChanges,
        saveLayoutChanges,
        discardLayoutChanges,
        saveStatus,
        conflictData,
        resolveConflict,
    } = useLayoutChange();
    const { hasContentChanges: hasContent } = useLayoutHistory();

    const editingCount = getEditingCount();
    const hasDataChanges = hasUnsavedChanges();
    const hasLayout = hasLayoutChanges();
    const hasContentChanges = hasContent;
    const totalChanges = editingCount + (hasLayout ? 1 : 0) + (hasContentChanges ? 1 : 0);

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        console.log(
            `📝 Edit Mode: ${editingCount} blocks editing, Layout changes: ${hasLayout}, Content changes: ${hasContentChanges}, Total unsaved changes: ${totalChanges}`
        );
    }, [editingCount, hasLayout, hasContentChanges, hasDataChanges, totalChanges]);
    const handleSaveAll = async () => {
        if (isSaving || saveStatus === "saving" || saveStatus === "conflict") {
            return;
        }
        setIsSaving(true);
        try {
            // Save active edit sessions
            if (hasDataChanges) await saveAllEdits();
            // Save layout and content changes (both are sent to backend together)
            if (hasLayout || hasContentChanges) await saveLayoutChanges();
        } catch (error) {
            console.error("Error saving all changes:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Set up keyboard shortcut for save (Ctrl/Cmd+S)
    const canSaveViaShortcut =
        !isSaving &&
        saveStatus !== "saving" &&
        saveStatus !== "conflict" &&
        (hasDataChanges || hasLayout || hasContentChanges);

    useLayoutKeyboardShortcuts(canSaveViaShortcut ? handleSaveAll : undefined);

    // Don't show indicator during initialization to prevent false positives
    // from widget sync operations
    const shouldShow = isInitialized && totalChanges > 0;

    const handleDiscardAll = () => {
        // Discard block data edits
        if (hasDataChanges) {
            discardAllEdits();
        }

        // Discard layout and content changes
        if (hasLayout || hasContentChanges) {
            discardLayoutChanges();
        }
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
                        {editingCount > 0 && (hasLayout || hasContentChanges) && (
                            <span className="text-primary-foreground/60">•</span>
                        )}
                        {hasLayout && (
                            <>
                                <Layout className="h-4 w-4" />
                                <span className="font-medium">Layout modified</span>
                            </>
                        )}
                        {hasLayout && hasContentChanges && (
                            <span className="text-primary-foreground/60">•</span>
                        )}
                        {hasContentChanges && (
                            <>
                                <FileEdit className="h-4 w-4" />
                                <span className="font-medium">Content modified</span>
                            </>
                        )}
                    </div>

                    {(hasDataChanges || hasLayout || hasContentChanges) && (
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
                            disabled={
                                isSaving || saveStatus === "saving" || saveStatus === "conflict"
                            }
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            {isSaving || saveStatus === "saving"
                                ? "Saving..."
                                : saveStatus === "conflict"
                                ? "Conflict!"
                                : "Save All"}
                        </Button>
                        <Button
                            size="sm"
                            variant="destructive"
                            className="bg-destructive/50"
                            onClick={handleDiscardAll}
                            disabled={isSaving || saveStatus === "saving"}
                            title="Discard all unsaved changes"
                        >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Discard All
                        </Button>
                    </div>
                </motion.div>
            )}

            {/* Conflict Resolution Modal */}
            {saveStatus === "conflict" && conflictData && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) {
                            resolveConflict("cancel");
                        }
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-background border border-border rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
                    >
                        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500" />
                            Layout Conflict Detected
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Another user ({conflictData.lastModifiedBy}) saved changes while you
                            were editing. You can keep your changes or use their version.
                        </p>
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                onClick={() => resolveConflict("keep-mine")}
                                className="w-full"
                            >
                                Keep My Changes
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => resolveConflict("use-theirs")}
                                className="w-full"
                            >
                                Use Their Version
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => resolveConflict("cancel")}
                                className="w-full"
                            >
                                Cancel
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
