"use client";
import { useOrganisationStore } from "@/components/provider/OrganisationContext";
import { useProfile } from "@/hooks/useProfile";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import { Organisation } from "@/lib/interfaces/organisation.interface";
import {
    Boxes,
    Building2,
    CalendarHeart,
    ChevronsLeftRightEllipsis,
    CogIcon,
    Computer,
    DatabaseBackup,
    TextSearch,
    TrendingUpDown,
    Users,
    Waypoints,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../button";
import { Skeleton } from "../skeleton";
import { AppSidebar } from "./root-sidebar";
import { OptionSwitcher } from "./switcher";

export const DashboardSidebar = () => {
    const router = useRouter();
    const pathName = usePathname();
    console.log(pathName);

    const { data, isPending, isLoadingAuth } = useProfile();
    const [selectedOrganisation, setSelectedOrganisation] = useState<Organisation | null>(null);

    const selectedOrganisationId = useOrganisationStore((store) => store.selectedOrganisationId); // Select specific state
    const setSelectedOrganisationId = useOrganisationStore(
        (store) => store.setSelectedOrganisation
    );

    const loadingUser = isPending || isLoadingAuth;

    useEffect(() => {
        if (!data) return;

        setSelectedOrganisation(
            data?.memberships.find((m) => m.organisation?.id === selectedOrganisationId)
                ?.organisation || null
        );
    }, [data, selectedOrganisationId]);

    // This is sample data.
    const sidebarContent: SidebarGroupProps[] = selectedOrganisation
        ? [
              {
                  title: "Organisation",

                  items: [
                      {
                          icon: Building2,
                          hidden: false,
                          title: "Overview",
                          url: `/dashboard/organisation/${selectedOrganisation.id}`,
                          isActive:
                              pathName === `/dashboard/organisation/${selectedOrganisation.id}`,
                      },
                      {
                          icon: Users,
                          hidden: false,
                          title: "Members",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/members`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/members`
                          ),
                      },
                      {
                          icon: Users,
                          hidden: false,
                          title: "Invites",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/invites`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/invites`
                          ),
                      },
                  ],
              },
              {
                  title: "Configuration",
                  items: [
                      {
                          icon: Boxes,
                          hidden: false,
                          title: "Message Brokers",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/configuration`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/configuration`
                          ),
                      },
                      {
                          icon: Computer,
                          hidden: false,
                          title: "Compute and Processing",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/compute`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/compute`
                          ),
                      },
                  ],
              },
              {
                  title: "Features",
                  items: [
                      {
                          icon: Waypoints,
                          hidden: false,
                          title: "Event Router",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/router`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/router`
                          ),
                      },
                      {
                          icon: ChevronsLeftRightEllipsis,
                          hidden: false,
                          title: "Event Proxy",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/proxy`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/proxy`
                          ),
                      },
                      {
                          icon: TextSearch,
                          hidden: false,
                          title: "Event Websocket Stream",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/stream`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/stream`
                          ),
                      },
                      {
                          icon: DatabaseBackup,
                          hidden: false,
                          title: "Database Discovery",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/database`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/database`
                          ),
                      },
                  ],
              },

              {
                  title: "Billing",
                  items: [
                      {
                          icon: CalendarHeart,
                          hidden: false,
                          title: "Subscription",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/subscriptions`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/subscriptions`
                          ),
                      },
                      {
                          icon: TrendingUpDown,
                          hidden: false,
                          title: "Usage",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/usage`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/usage`
                          ),
                      },
                  ],
              },
              {
                  title: "Organisation Settings",
                  items: [
                      {
                          icon: CogIcon,
                          hidden: false,
                          title: "Settings",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/settings`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/settings`
                          ),
                      },
                  ],
              },
          ]
        : [];

    const handleOrganisationSelection = (organisation: Organisation) => {
        if (!setSelectedOrganisationId) return;

        setSelectedOrganisation(organisation);
        setSelectedOrganisationId(organisation);
        router.push("/dashboard/organisation/" + organisation.id);
    };

    return (
        <AppSidebar
            header={() => {
                if (loadingUser) {
                    return <Skeleton className="w-auto flex-grow flex h-8 mt-3 mx-4 " />;
                }

                if (data) {
                    if (data.memberships.length === 0) {
                        return (
                            <Link
                                className="mt-3 w-auto flex-grow flex mx-4"
                                href={"/dashboard/organisation/new"}
                            >
                                <Button variant={"outline"} className="w-full" size={"sm"}>
                                    Create Organisation
                                </Button>
                            </Link>
                        );
                    }
                    return (
                        <OptionSwitcher
                            addNewLink="/dashboard/organisation/new"
                            addNewTitle="Create Organisation"
                            title={"Organisations"}
                            options={
                                data.memberships
                                    .map((org) => org.organisation)
                                    .filter((org) => !!org) ?? []
                            }
                            selectedOption={selectedOrganisation}
                            handleOptionSelection={handleOrganisationSelection}
                            render={(org) => <span>{org.name}</span>}
                        />
                    );
                }

                return <></>;
            }}
            body={sidebarContent}
        />
    );
};
