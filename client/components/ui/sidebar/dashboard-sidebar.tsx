"use client";
import { useOrganisationStore } from "@/components/provider/OrganisationContent";
import { useProfile } from "@/hooks/useProfile";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import { Organisation } from "@/lib/interfaces/organisation.interface";
import {
    Building2,
    CalendarHeart,
    CogIcon,
    LayoutIcon,
    LayoutTemplate,
    TrendingUpDown,
    UserPlus,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../button";
import { Skeleton } from "../skeleton";
import { AppSidebar } from "./root-sidebar";
import { OptionSwitcher } from "./switcher";

export const DashboardSidebar = () => {
    const pathName = usePathname();
    const router = useRouter();
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

    const handleOrganisationSelection = (organisation: Organisation) => {
        if (!setSelectedOrganisationId) return;

        setSelectedOrganisation(organisation);
        setSelectedOrganisationId(organisation);
        router.push("/dashboard/organisation/" + organisation.id);
    };

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
                  title: "Invoices",

                  items: [
                      {
                          icon: Building2,
                          hidden: false,
                          title: "New Invoice",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/invoice/new`,
                          isActive: pathName === `/dashboard/invoice/new`,
                      },
                      {
                          icon: Users,
                          hidden: false,
                          title: "Generated",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/invoice/`,
                          isActive: pathName === `/dashboard/invoice/`,
                      },
                  ],
              },
              {
                  title: "Clients",
                  items: [
                      {
                          icon: UserPlus,
                          hidden: false,
                          title: "New Client",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/clients/new`,
                          isActive: pathName.startsWith(`/dashboard/clients/new`),
                      },
                      {
                          icon: Users,
                          hidden: false,
                          title: "All Clients",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/clients`,
                          isActive: pathName === `/dashboard/clients`,
                      },
                  ],
              },
              {
                  title: "Templates",
                  items: [
                      {
                          icon: LayoutIcon,
                          hidden: false,
                          title: "New Template",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/templates/new`,
                          isActive: pathName.startsWith(`/dashboard/templates/new`),
                      },
                      {
                          icon: LayoutTemplate,
                          hidden: false,
                          title: "Manage Templates",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/templates`,
                          isActive: pathName.startsWith("/dashboard/templates"),
                      },
                  ],
              },
              {
                  title: "Line Items",
                  items: [
                      {
                          icon: UserPlus,
                          hidden: false,
                          title: "New Line Item",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/item/new`,
                          isActive: pathName.startsWith(`/dashboard/item/new`),
                      },
                      {
                          icon: Users,
                          hidden: false,
                          title: "All Line Items",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/item`,
                          isActive: pathName === `/dashboard/item`,
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
                          isActive: pathName.startsWith(`/dashboard/subscriptions`),
                      },
                      {
                          icon: TrendingUpDown,
                          hidden: false,
                          title: "Usage",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/usage`,
                          isActive: pathName.startsWith(`/dashboard/usage`),
                      },
                  ],
              },
              {
                  title: "Settings",
                  items: [
                      {
                          icon: CogIcon,
                          hidden: false,
                          title: "Organisation Settings",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/settings`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/settings`
                          ),
                      },
                      {
                          icon: CogIcon,
                          hidden: false,
                          title: "Account Settings",
                          url: `/dashboard/settings`,
                          isActive: pathName.startsWith(`/dashboard/settings`),
                      },
                  ],
              },
          ]
        : [
              {
                  title: "Settings",
                  items: [
                      {
                          icon: CogIcon,
                          hidden: false,
                          title: "Account Settings",
                          url: `/dashboard/settings`,
                          isActive: pathName.startsWith(`/dashboard/settings`),
                      },
                  ],
              },
          ];

    return (
        <AppSidebar
            header={() => {
                if (loadingUser) {
                    return <Skeleton className="w-auto flex-grow flex h-8 mt-3 mx-4 " />;
                }

                if (data) {
                    if (data.memberships.length === 0) {
                        return (
                            <>
                                <Link
                                    className="mt-3 w-auto flex-grow flex mx-4"
                                    href={"/dashboard/organisation/new"}
                                >
                                    <Button
                                        variant={"outline"}
                                        type="button"
                                        className="w-full cursor-pointer"
                                        size={"sm"}
                                    >
                                        Create Organisation
                                    </Button>
                                </Link>
                                <section className="mb-8">
                                    <div className="flex justify-center mt-6 mb-4 [&_svg:not([class*='text-'])]:text-muted-foreground">
                                        <Building2 className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h1 className="text-content text-sm font-semibold text-center">
                                            No Organisations Found
                                        </h1>
                                        <p className="text-xs text-muted-foreground text-center">
                                            You currently do not have any organisations. Create one
                                            to get started.
                                        </p>
                                    </div>
                                </section>
                            </>
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
