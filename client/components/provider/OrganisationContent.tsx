"use client";

import { useProfile } from "@/hooks/useProfile";
import {
    createOrganisationStore,
    type OrganisationStore,
} from "@/stores/organisation/organisation.store";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { useStore } from "zustand";

type OrganisationStoreApi = ReturnType<typeof createOrganisationStore>;

export const OrganisationsStoreContext = createContext<OrganisationStoreApi | undefined>(undefined);

export interface OrganisationsStoreProviderProps {
    children: ReactNode;
}

export const OrganisationsStoreProvider = ({ children }: OrganisationsStoreProviderProps) => {
    const { data: user } = useProfile();
    const store = useRef<OrganisationStoreApi | undefined>(undefined);

    if (!store.current) {
        store.current = createOrganisationStore();
    }

    useEffect(() => {
        if (!user) return;
        const selectedOrganisationId = localStorage.getItem("selectedOrganisation");
        if (selectedOrganisationId) {
            const selectedOrganisation = user.memberships.find(
                (m) => m.organisation?.id === selectedOrganisationId
            )?.organisation;

            if (selectedOrganisation) {
                store.current?.setState({
                    selectedOrganisationId: selectedOrganisation.id,
                });
            }
        } else {
            // If no organisation is selected, set the first one as default
            const firstOrganisation = user.memberships[0]?.organisation;
            if (firstOrganisation) {
                store.current?.setState({
                    selectedOrganisationId: firstOrganisation.id,
                });
            }
        }
    }, [user]);

    return (
        <OrganisationsStoreContext.Provider value={store.current}>
            {children}
        </OrganisationsStoreContext.Provider>
    );
};

export const useOrganisationStore = <T,>(
    selector: (store: OrganisationStore) => T
): T | undefined => {
    const context = useContext(OrganisationsStoreContext);

    if (!context) {
        throw new Error("useOrganisationStore must be used within a OrganisationsStoreProvider");
    }
    return useStore(context, selector);
};
