"use client";

import { FC } from "react";
import { useBlockEdit } from "../../context/block-edit-provider";
import { AlertCircle, Edit3, Lock } from "lucide-react";
import { cn } from "@/lib/util/utils";
import { AnimatePresence, motion } from "framer-motion";

export const EditModeIndicator: FC = () => {
    const { getEditingCount, hasUnsavedChanges } = useBlockEdit();
    const editingCount = getEditingCount();

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
                </motion.div>
            )}
        </AnimatePresence>
    );
};
