import { useOrganisation } from "@/hooks/useOrganisation";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import { Combine } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/router";
import { useState } from "react";

const ClusterManagementSidebar = () => {
    const router = useRouter();
    const pathName = usePathname();
    const { data: organisation, isPending, isLoadingAuth } = useOrganisation();
    const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
    

    const sidebarContent: SidebarGroupProps[] = organisation ? [
        {title: "Cluster Management", items: [
            {
                icon: Combine,
                title: "Brokers"
            }

        ]}
    ] : [];

    return <div></div>;
};

export default ClusterManagementSidebar;
