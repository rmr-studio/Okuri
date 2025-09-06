import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrganisationRole } from "@/hooks/useOrganisationRole";
import { Crown, Shield, User } from "lucide-react";

/**
 * Example component demonstrating the useOrganisationRole hook
 * This shows how to conditionally render content based on user roles
 */
export const OrganisationRoleExample = () => {
    const {
        role,
        isOwner,
        isAdmin,
        isMember,
        hasRole,
        isLoading,
        error,
        member,
    } = useOrganisationRole();

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-red-600">
                        Error loading organisation role: {error.message}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!role) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-gray-600">
                        You are not a member of this organisation.
                    </div>
                </CardContent>
            </Card>
        );
    }

    const getRoleIcon = () => {
        switch (role) {
            case "OWNER":
                return <Crown className="w-4 h-4 text-yellow-600" />;
            case "ADMIN":
                return <Shield className="w-4 h-4 text-blue-600" />;
            case "MEMBER":
                return <User className="w-4 h-4 text-gray-600" />;
            default:
                return <User className="w-4 h-4" />;
        }
    };

    const getRoleColor = () => {
        switch (role) {
            case "OWNER":
                return "bg-yellow-100 text-yellow-800";
            case "ADMIN":
                return "bg-blue-100 text-blue-800";
            case "MEMBER":
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Your Organisation Role
                    {getRoleIcon()}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Role Display */}
                <div className="flex items-center gap-2">
                    <Badge className={getRoleColor()}>{role}</Badge>
                    <span className="text-sm text-gray-600">
                        Member since:{" "}
                        {member?.memberSince
                            ? new Date(member.memberSince).toLocaleDateString()
                            : "Unknown"}
                    </span>
                </div>

                {/* Role Capabilities */}
                <div className="space-y-2">
                    <h4 className="font-medium">Your Capabilities:</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    isMember ? "bg-green-500" : "bg-gray-300"
                                }`}
                            />
                            <span>View organisation content</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    hasRole("ADMIN")
                                        ? "bg-green-500"
                                        : "bg-gray-300"
                                }`}
                            />
                            <span>Manage members and invites</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-2 h-2 rounded-full ${
                                    isOwner ? "bg-green-500" : "bg-gray-300"
                                }`}
                            />
                            <span>Delete organisation</span>
                        </div>
                    </div>
                </div>

                {/* Conditional Actions */}
                <div className="space-y-2">
                    <h4 className="font-medium">Available Actions:</h4>
                    <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline">
                            View Organisation
                        </Button>

                        {hasRole("ADMIN") && (
                            <Button size="sm" variant="outline">
                                Manage Members
                            </Button>
                        )}

                        {isOwner && (
                            <Button size="sm" variant="destructive">
                                Delete Organisation
                            </Button>
                        )}
                    </div>
                </div>

                {/* Role Hierarchy Info */}
                <div className="text-xs text-gray-500 border-t pt-2">
                    <p>Role Hierarchy: MEMBER → ADMIN → OWNER</p>
                    <p>
                        Higher roles inherit all permissions from lower roles.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
