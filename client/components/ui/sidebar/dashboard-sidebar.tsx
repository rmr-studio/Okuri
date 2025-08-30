"use client";
import { useOrganisationStore } from "@/components/provider/OrganisationContext";
import { useProfile } from "@/hooks/useProfile";
import { SidebarGroupProps } from "@/lib/interfaces/interface";
import { Organisation } from "@/lib/interfaces/organisation.interface";
import {
    BanknoteArrowUp,
    BookTextIcon,
    Building2,
    CalendarHeart,
    CogIcon,
    Contact,
    LayoutTemplate,
    PlusCircle,
    TrendingUpDown,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "../button";
import { Skeleton } from "../skeleton";
import { AppSidebar } from "./root-sidebar";
import { Action, OptionSwitcher } from "./switcher";

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

    const switcherOptions: Action[] = [
        {
            title: "Create Organisation",
            link: "/dashboard/organisation/new",
            icon: PlusCircle,
        },
        {
            title: "View All Organisations",
            link: "/dashboard/organisation",
            icon: Building2,
        },
    ];

    const sidebarContent: SidebarGroupProps[] = selectedOrganisation
        ? [
              {
                  items: [
                      {
                          icon: Building2,
                          hidden: false,
                          title: "Organisation",
                          url: `/dashboard/organisation/${selectedOrganisation.id}`,
                          isActive:
                              pathName === `/dashboard/organisation/${selectedOrganisation.id}`,
                      },
                      {
                          icon: Users,
                          hidden: false,
                          title: "Team",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/members`,
                          isActive: pathName.startsWith(
                              `/dashboard/organisation/${selectedOrganisation.id}/members`
                          ),
                      },
                      {
                          icon: Contact,
                          hidden: false,
                          title: "Clients",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/clients`,
                          isActive: pathName === `/dashboard/${selectedOrganisation.id}/clients`,
                      },
                      {
                          icon: BookTextIcon,
                          hidden: false,
                          title: "Invoices",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/invoice/`,
                          isActive: pathName === `/dashboard/${selectedOrganisation.id}/invoice`,
                      },

                      {
                          icon: LayoutTemplate,
                          hidden: false,
                          title: "Templates",
                          url: `/dashboard/templates`,
                          isActive: pathName.startsWith("/dashboard/templates"),
                      },

                      {
                          icon: BanknoteArrowUp,
                          hidden: false,
                          title: "Billables",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/billable`,
                          isActive: pathName.startsWith(`/dashboard/billable`),
                      },
                  ],
              },
              {
                  items: [
                      {
                          icon: TrendingUpDown,
                          hidden: false,
                          title: "Usage",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/usage`,
                          isActive: pathName.startsWith(`/dashboard/usage`),
                      },
                      {
                          icon: CalendarHeart,
                          hidden: false,
                          title: "Subscription",
                          url: `/dashboard/organisation/${selectedOrganisation.id}/subscriptions`,
                          isActive: pathName.startsWith(`/dashboard/subscriptions`),
                      },
                  ],
              },
              {
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
                  ],
              },
          ]
        : [];

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
                            additionalActions={switcherOptions}
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
