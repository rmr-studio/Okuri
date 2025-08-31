"use client";

import { useAuth } from "@/components/provider/auth-context";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { updateOrganisation } from "@/controller/organisation.controller";
import {
    Organisation,
    TileLayoutConfig,
    TileSection,
} from "@/lib/interfaces/organisation.interface";
import { cn } from "@/lib/util/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Building2,
    Eye,
    EyeOff,
    GripVertical,
    Image as ImageIcon,
    Plus,
    Settings2,
    Trash2,
    Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TileLayoutEditorProps {
    organisation: Organisation;
    isOpen: boolean;
    onClose: () => void;
}

const defaultLayout: TileLayoutConfig = {
    sections: [
        {
            id: "avatar",
            type: "avatar",
            title: "Avatar",
            visible: true,
            order: 0,
            width: 40,
            height: 40,
            x: 0,
            y: 0,
        },
        {
            id: "info",
            type: "info",
            title: "Basic Info",
            visible: true,
            order: 1,
            width: 200,
            height: 60,
            x: 50,
            y: 0,
        },
        {
            id: "details",
            type: "details",
            title: "Details",
            visible: true,
            order: 2,
            width: 200,
            height: 40,
            x: 0,
            y: 70,
        },
    ],
    spacing: 8,
    showAvatar: true,
    showPlan: true,
    showMemberCount: true,
    showMemberSince: true,
    showRole: true,
    showCustomAttributes: false,
    showAddress: false,
    showPaymentInfo: false,
    showBusinessNumber: false,
    showTaxId: false,
};

export const TileLayoutEditor: React.FC<TileLayoutEditorProps> = ({
    organisation,
    isOpen,
    onClose,
}) => {
    const { session } = useAuth();
    const queryClient = useQueryClient();

    const [layout, setLayout] = useState<TileLayoutConfig>(
        organisation.tileLayout || defaultLayout
    );
    const [draggedSection, setDraggedSection] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);

    const updateLayoutMutation = useMutation({
        mutationFn: (newLayout: TileLayoutConfig) =>
            updateOrganisation(session, organisation.id, {
                tileLayout: newLayout,
            }),
        onSuccess: () => {
            toast.success("Tile layout updated successfully");
            queryClient.invalidateQueries({
                queryKey: ["organisation", organisation.id],
            });
            onClose();
        },
        onError: (error) => {
            toast.error(`Failed to update layout: ${error.message}`);
        },
    });

    const handleSave = () => {
        updateLayoutMutation.mutate(layout);
    };

    const toggleSectionVisibility = (sectionId: string) => {
        setLayout((prev) => ({
            ...prev,
            sections: prev.sections.map((section) =>
                section.id === sectionId ? { ...section, visible: !section.visible } : section
            ),
        }));
    };

    const moveSection = (sectionId: string, direction: "up" | "down") => {
        setLayout((prev) => {
            const sections = [...prev.sections];
            const index = sections.findIndex((s) => s.id === sectionId);
            if (index === -1) return prev;

            const newIndex = direction === "up" ? index - 1 : index + 1;
            if (newIndex < 0 || newIndex >= sections.length) return prev;

            [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];
            sections[index].order = index;
            sections[newIndex].order = newIndex;

            return { ...prev, sections };
        });
    };

    const updateSectionPosition = (sectionId: string, x: number, y: number) => {
        setLayout((prev) => ({
            ...prev,
            sections: prev.sections.map((section) =>
                section.id === sectionId ? { ...section, x, y } : section
            ),
        }));
    };

    const updateSectionSize = (sectionId: string, width: number, height: number) => {
        setLayout((prev) => ({
            ...prev,
            sections: prev.sections.map((section) =>
                section.id === sectionId ? { ...section, width, height } : section
            ),
        }));
    };

    const addCustomSection = () => {
        const newSection: TileSection = {
            id: `custom-${Date.now()}`,
            type: "custom",
            title: "Custom Section",
            visible: true,
            order: layout.sections.length,
            width: 150,
            height: 40,
            x: 0,
            y: layout.sections.length * 50,
            customAttributes: [],
        };

        setLayout((prev) => ({
            ...prev,
            sections: [...prev.sections, newSection],
        }));
    };

    const removeSection = (sectionId: string) => {
        setLayout((prev) => ({
            ...prev,
            sections: prev.sections.filter((section) => section.id !== sectionId),
        }));
        setSelectedSection(null);
    };

    const getAvailableCustomAttributes = () => {
        return Object.keys(organisation.customAttributes || {});
    };

    const renderSectionIcon = (type: string) => {
        const iconMap = {
            avatar: ImageIcon,
            info: Building2,
            details: Users,
            custom: Settings2,
        };
        const Icon = iconMap[type as keyof typeof iconMap] || Settings2;
        return <Icon className="w-4 h-4" />;
    };

    const renderPreviewTile = () => {
        return (
            <div className="border rounded-lg p-4 bg-card w-72 h-32 relative">
                {layout.sections
                    .filter((section) => section.visible)
                    .sort((a, b) => a.order - b.order)
                    .map((section) => (
                        <div
                            key={section.id}
                            className={cn(
                                "absolute border-2 border-dashed border-gray-300 bg-gray-50/50 cursor-move",
                                selectedSection === section.id && "border-blue-500 bg-blue-50/50",
                                previewMode && "hover:border-blue-400"
                            )}
                            style={{
                                left: section.x,
                                top: section.y,
                                width: section.width,
                                height: section.height,
                            }}
                            onClick={() => setSelectedSection(section.id)}
                            onMouseDown={(e) => {
                                if (!previewMode) return;
                                e.preventDefault();
                                setDraggedSection(section.id);

                                const handleMouseMove = (e: MouseEvent) => {
                                    if (!draggedSection) return;
                                    const rect = e.currentTarget?.getBoundingClientRect();
                                    if (rect) {
                                        updateSectionPosition(
                                            draggedSection,
                                            e.clientX - rect.left,
                                            e.clientY - rect.top
                                        );
                                    }
                                };

                                const handleMouseUp = () => {
                                    setDraggedSection(null);
                                    document.removeEventListener("mousemove", handleMouseMove);
                                    document.removeEventListener("mouseup", handleMouseUp);
                                };

                                document.addEventListener("mousemove", handleMouseMove);
                                document.addEventListener("mouseup", handleMouseUp);
                            }}
                        >
                            <div className="flex items-center justify-center h-full text-xs text-gray-500">
                                {section.title}
                            </div>
                        </div>
                    ))}
            </div>
        );
    };

    const renderSectionEditor = () => {
        if (!selectedSection) return null;

        const section = layout.sections.find((s) => s.id === selectedSection);
        if (!section) return null;

        return (
            <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Section: {section.title}</Label>
                    <Button variant="ghost" size="sm" onClick={() => removeSection(section.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="text-xs">Width</Label>
                        <Input
                            type="number"
                            value={section.width}
                            onChange={(e) =>
                                updateSectionSize(
                                    section.id,
                                    parseInt(e.target.value),
                                    section.height
                                )
                            }
                            min={20}
                            max={300}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Height</Label>
                        <Input
                            type="number"
                            value={section.height}
                            onChange={(e) =>
                                updateSectionSize(
                                    section.id,
                                    section.width,
                                    parseInt(e.target.value)
                                )
                            }
                            min={20}
                            max={100}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">X Position</Label>
                        <Input
                            type="number"
                            value={section.x}
                            onChange={(e) =>
                                updateSectionPosition(
                                    section.id,
                                    parseInt(e.target.value),
                                    section.y
                                )
                            }
                            min={0}
                            max={250}
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Y Position</Label>
                        <Input
                            type="number"
                            value={section.y}
                            onChange={(e) =>
                                updateSectionPosition(
                                    section.id,
                                    section.x,
                                    parseInt(e.target.value)
                                )
                            }
                            min={0}
                            max={100}
                        />
                    </div>
                </div>
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] min-w-[90dvw] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Customize Tile Layout</DialogTitle>
                    <DialogDescription>
                        Drag and drop sections to rearrange your organisation tile layout. Toggle
                        visibility and adjust settings for each section.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Layout Controls */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label>Preview Mode</Label>
                            <Switch checked={previewMode} onCheckedChange={setPreviewMode} />
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium">Sections</Label>
                                <Button variant="outline" size="sm" onClick={addCustomSection}>
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add
                                </Button>
                            </div>
                            {layout.sections.map((section) => (
                                <div
                                    key={section.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 border rounded-lg cursor-pointer",
                                        selectedSection === section.id &&
                                            "border-blue-500 bg-blue-50/50"
                                    )}
                                    onClick={() => setSelectedSection(section.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                        {renderSectionIcon(section.type)}
                                        <span className="text-sm">{section.title}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleSectionVisibility(section.id);
                                            }}
                                        >
                                            {section.visible ? (
                                                <Eye className="w-4 h-4" />
                                            ) : (
                                                <EyeOff className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveSection(section.id, "up");
                                            }}
                                            disabled={section.order === 0}
                                        >
                                            ↑
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                moveSection(section.id, "down");
                                            }}
                                            disabled={section.order === layout.sections.length - 1}
                                        >
                                            ↓
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        <div className="space-y-3">
                            <Label className="text-sm font-medium">Display Options</Label>
                            <div className="space-y-2">
                                {Object.entries({
                                    showPlan: "Plan",
                                    showMemberCount: "Member Count",
                                    showMemberSince: "Member Since",
                                    showRole: "Role",
                                    showCustomAttributes: "Custom Attributes",
                                    showAddress: "Address",
                                    showPaymentInfo: "Payment Info",
                                    showBusinessNumber: "Business Number",
                                    showTaxId: "Tax ID",
                                }).map(([key, label]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <Label className="text-sm">{label}</Label>
                                        <Switch
                                            checked={
                                                layout[key as keyof TileLayoutConfig] as boolean
                                            }
                                            onCheckedChange={(checked) =>
                                                setLayout((prev) => ({
                                                    ...prev,
                                                    [key]: checked,
                                                }))
                                            }
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Section Editor */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Section Properties</Label>
                        {renderSectionEditor()}
                    </div>

                    {/* Preview */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium">Preview</Label>
                        {renderPreviewTile()}

                        <div className="text-xs text-gray-500">
                            <p>• Click sections to select and edit properties</p>
                            <p>• Enable preview mode to drag sections</p>
                            <p>• Toggle visibility with the eye icon</p>
                            <p>• Reorder sections with arrow buttons</p>
                            <p>• Customize what information is displayed</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={updateLayoutMutation.isPending}>
                        {updateLayoutMutation.isPending ? "Saving..." : "Save Layout"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
