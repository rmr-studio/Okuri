import { useQuery } from "@tanstack/react-query";

export function useReportTemplates(userId: string | null, type: string) {
    return useQuery({
        queryKey: ["reportTemplates", userId, type],
        queryFn: async () => {
            if (!userId) throw new Error("No user ID provided");
            const res = await fetch(
                `/api/report-templates?userId=${userId}&type=${type}`
            );
            if (!res.ok) throw new Error("Failed to fetch templates");
            return res.json();
        },
        enabled: !!userId && !!type,
        staleTime: 5 * 60 * 1000,
    });
}
