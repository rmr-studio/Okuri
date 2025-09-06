"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MembershipDetails, TileLayoutConfig } from "@/lib/interfaces/organisation.interface";
import { toTitleCase } from "@/lib/util/utils";
import { ArrowRightIcon, Edit3Icon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FC, useState } from "react";
import { TileLayoutEditor } from "./organisation-tile-editor";

interface Props {
    membership: MembershipDetails;
    isDefault: boolean;
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

export const OrganisationTile: FC<Props> = ({ membership }) => {
    const { organisation, role, memberSince } = membership;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    if (!organisation) return null;

    const layout = organisation.tileLayout || defaultLayout;

    const renderAvatarSection = () => {
        if (!layout.showAvatar) return null;

        return (
            <div className="relative w-10 h-10 overflow-hidden rounded-md bg-background/60 border mr-4">
                <Image
                    src={organisation?.avatarUrl || "/vercel.svg"}
                    alt={`${organisation?.name} logo`}
                    fill
                    className="object-cover p-3"
                />
            </div>
        );
    };

    const renderInfoSection = () => {
        return (
            <div>
                <div className="text-sm text-content">{organisation.name}</div>
                <div className="text-xs text-content flex items-center">
                    {layout.showPlan && (
                        <>
                            <span>{toTitleCase(organisation.plan)} Plan</span>
                            <span className="mx-2 text-base">•</span>
                        </>
                    )}
                    {layout.showMemberCount && (
                        <span>
                            {organisation.memberCount} Member
                            {organisation.memberCount > 1 && "s"}
                        </span>
                    )}
                </div>
            </div>
        );
    };

    const renderDetailsSection = () => {
        return (
            <div className="mt-4 text-xs text-content flex justify-between items-end">
                <div>
                    {layout.showRole && <div className="font-semibold">{toTitleCase(role)}</div>}
                    {layout.showMemberSince && (
                        <div>Member since {new Date(memberSince).toLocaleDateString()}</div>
                    )}
                </div>
                <ArrowRightIcon className="w-5 h-5 text-content mb-1" />
            </div>
        );
    };

    const renderCustomAttributes = () => {
        if (!layout.showCustomAttributes || !organisation.customAttributes) return null;

        return (
            <div className="mt-2 text-xs text-content">
                {Object.entries(organisation.customAttributes).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                        <span className="font-medium">{key}:</span>
                        <span>{String(value)}</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderAddressInfo = () => {
        if (!layout.showAddress || !organisation.address) return null;

        const { address } = organisation;
        return (
            <div className="mt-2 text-xs text-content">
                <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>
                        {[address.street, address.city, address.state, address.postalCode]
                            .filter(Boolean)
                            .join(", ")}
                    </span>
                </div>
            </div>
        );
    };

    const renderPaymentInfo = () => {
        if (!layout.showPaymentInfo || !organisation.organisationPaymentDetails) return null;

        const { organisationPaymentDetails } = organisation;
        return (
            <div className="mt-2 text-xs text-content">
                <div className="flex items-center gap-1">
                    <span>💳</span>
                    <span>
                        {organisationPaymentDetails.accountName &&
                            `${organisationPaymentDetails.accountName} • `}
                        {organisationPaymentDetails.bsb && `BSB: ${organisationPaymentDetails.bsb}`}
                    </span>
                </div>
            </div>
        );
    };

    const renderBusinessInfo = () => {
        if (!layout.showBusinessNumber && !layout.showTaxId) return null;

        return (
            <div className="mt-2 text-xs text-content">
                {layout.showBusinessNumber && organisation.businessNumber && (
                    <div>Business: {organisation.businessNumber}</div>
                )}
                {layout.showTaxId && organisation.taxId && <div>Tax ID: {organisation.taxId}</div>}
            </div>
        );
    };

    const handleEditClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditModalOpen(true);
    };

    return (
        <>
            <Card className="p-3 cursor-pointer hover:bg-card/60 rounded-md relative group">
                <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={handleEditClick}
                >
                    <Edit3Icon className="w-4 h-4" />
                </Button>

                <Link href={`/dashboard/organisation/${organisation.id}`}>
                    <CardContent className="px-2 w-72">
                        <section className="flex">
                            {renderAvatarSection()}
                            {renderInfoSection()}
                        </section>

                        {renderDetailsSection()}
                        {renderCustomAttributes()}
                        {renderAddressInfo()}
                        {renderPaymentInfo()}
                        {renderBusinessInfo()}
                    </CardContent>
                </Link>
            </Card>
            <TileLayoutEditor
                organisation={organisation}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            />
        </>
    );
};
