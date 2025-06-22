"use client";

import { FCWC, Propless } from "@/lib/interfaces/interface";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";

const QueryClientWrapper: FCWC<Propless> = ({ children }) => {
    const queryClient = useMemo(() => new QueryClient(), []);

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

export default QueryClientWrapper;
