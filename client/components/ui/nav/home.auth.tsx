"use client";

import { useProfile } from "@/components/feature-modules/user/hooks/useProfile";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { UserProfileDropdown } from "../../feature-modules/user/components/avatar-dropdown";
import AuthenticateButton from "../AuthenticateButton";

const LoadingSkeleton = () => (
    <motion.div
        key="skeleton"
        layoutId="auth-button"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
        }}
        className="flex items-center justify-center"
    >
        <div className="relative overflow-hidden">
            {/* Main skeleton shape */}
            <div className="h-8 w-24 border border-border/40 bg-white/5 backdrop-blur-md rounded-md" />

            {/* Shimmer effect */}
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-md"
                animate={{
                    x: [-120, 120],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeIn",
                }}
            />
        </div>
    </motion.div>
);

export const HomeNavbarAuthentication = () => {
    const { data: profile, isLoading, isLoadingAuth } = useProfile();
    const isFetching = isLoading || isLoadingAuth;

    return (
        <LayoutGroup>
            <div className="relative">
                <AnimatePresence mode="wait">
                    {isFetching ? (
                        <LoadingSkeleton />
                    ) : !profile ? (
                        <motion.div
                            key="authenticate"
                            layoutId="auth-button"
                            initial={{
                                opacity: 0,
                                scale: 0.9,
                                filter: "blur(4px)",
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                filter: "blur(0px)",
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.9,
                                filter: "blur(4px)",
                            }}
                            transition={{
                                duration: 0.4,
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                            }}
                        >
                            <AuthenticateButton />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="profile"
                            layoutId="auth-button"
                            initial={{
                                opacity: 0,
                                scale: 0.9,
                                rotate: -5,
                                filter: "blur(4px)",
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                rotate: 0,
                                filter: "blur(0px)",
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.8,
                                rotate: 5,
                                filter: "blur(4px)",
                            }}
                            transition={{
                                duration: 0.65,
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                            }}
                        >
                            <UserProfileDropdown user={profile} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </LayoutGroup>
    );
};
