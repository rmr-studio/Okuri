import { BlockTree } from "@/components/feature-modules/blocks/interface/block.interface";

export const contactTree: BlockTree = {
    root: {
        block: {
            id: "11111111-1111-1111-1111-111111111111",
            type: { key: "contact", version: 3 },
            payload: {
                data: {
                    client: {
                        id: "client-1111",
                        organisationId: "org-1111",
                        name: "Jane Doe",
                        archived: false,
                        type: "CUSTOMER",
                        contact: {
                            email: "jane@acme.com",
                            phone: "+61 400 000 000",
                            address: {
                                street: "1 Collins St",
                                city: "Melbourne",
                                state: "VIC",
                                postalCode: "3000",
                                country: "AU",
                            },
                        },
                        company: {
                            id: "company-1111",
                            organisationId: "org-1111",
                            name: "Acme Pty Ltd",
                            archived: false,
                            website: "https://acme.com",
                        },
                    },
                    links: {
                        profile: "/clients/client-1111",
                    },
                    avatarUrl: "https://avatar.vercel.sh/jane",
                    // The raw payload could also contain inline markers, but references are pre-extracted below
                },
            },
        },
        references: {
            // LINKED external entity (CLIENT) with a tiny summary we can render
            account: [
                {
                    entityType: "CLIENT",
                    entityId: "aaaa-bbbb-cccc",
                    ownership: "LINKED",
                    path: "$.data/client/company",
                    entity: { name: "Acme Pty Ltd", domain: "acme.com" },
                },
            ],
            // OWNED child blocks (addresses) with embedded entity payload for inline render
            addresses: [
                {
                    entityType: "BLOCK",
                    entityId: "addr-01",
                    ownership: "OWNED",
                    path: "$.data/addresses[0]",
                    orderIndex: 0,
                    entity: {
                        payload: {
                            data: {
                                street: "1 Collins St",
                                city: "Melbourne",
                                postalCode: "3000",
                                country: "AU",
                            },
                        },
                    },
                },
                {
                    entityType: "BLOCK",
                    entityId: "addr-02",
                    ownership: "OWNED",
                    path: "$.data/addresses[1]",
                    orderIndex: 1,
                    entity: {
                        payload: {
                            data: {
                                street: "2 George St",
                                city: "Sydney",
                                postalCode: "3000",
                                country: "AU",
                            },
                        },
                    },
                },
            ],
        },
    },
};

export const projectTree: BlockTree = {
    root: {
        block: {
            id: "22222222-2222-2222-2222-222222222222",
            type: { key: "project", version: 1 },
            payload: {
                data: {
                    project: {
                        id: "proj-01",
                        name: "Onboarding Portal Revamp",
                        status: "In Progress",
                        metrics: {
                            progressPercent: 68,
                            budgetUsedPercent: 45,
                            openRisks: 2,
                            completedTasks: 42,
                            totalTasks: 61,
                        },
                    },
                    summary: {
                        description:
                            "Reworking onboarding flows and portal UI for enterprise clients.",
                        dueDate: "2024-12-20",
                        phase: "Execution",
                    },
                    primaryAction: { label: "Open project" },
                },
            },
        },
        references: {
            owner: [
                {
                    entityType: "CLIENT",
                    entityId: "owner-001",
                    ownership: "LINKED",
                    path: "$.data/project/owner",
                    entity: { name: "Product Team", domain: "product.acme.com" },
                },
            ],
            tasks: [
                {
                    entityType: "BLOCK",
                    entityId: "task-001",
                    ownership: "OWNED",
                    path: "$.data/tasks[0]",
                    orderIndex: 0,
                    entity: {
                        payload: {
                            data: {
                                title: "Redesign dashboard wireframes",
                                assignee: "Jane Doe",
                                status: "IN_REVIEW",
                                dueDate: "2024-07-12",
                            },
                        },
                    },
                },
                {
                    entityType: "BLOCK",
                    entityId: "task-002",
                    ownership: "OWNED",
                    path: "$.data/tasks[1]",
                    orderIndex: 1,
                    entity: {
                        payload: {
                            data: {
                                title: "Implement analytics events",
                                assignee: "Kai Wong",
                                status: "IN_PROGRESS",
                                dueDate: "2024-07-19",
                            },
                        },
                    },
                },
                {
                    entityType: "BLOCK",
                    entityId: "task-003",
                    ownership: "OWNED",
                    path: "$.data/tasks[2]",
                    orderIndex: 2,
                    entity: {
                        payload: {
                            data: {
                                title: "Draft rollout communications",
                                assignee: "Tina Patel",
                                status: "NOT_STARTED",
                                dueDate: "2024-07-26",
                            },
                        },
                    },
                },
            ],
        },
    },
};

export const invoiceTree: BlockTree = {
    root: {
        block: {
            id: "33333333-3333-3333-3333-333333333333",
            type: { key: "invoice", version: 2 },
            payload: {
                data: {
                    invoice: {
                        number: "INV-2024-0005",
                        issueDate: "2024-06-01",
                        dueDate: "2024-06-21",
                        status: "OVERDUE",
                        notes: "Late fee applies after 7 days. Please reach out if you need an extension.",
                    },
                    totals: {
                        subtotal: 12000,
                        tax: 850,
                        discount: 0,
                        total: 12850,
                        currency: "AUD",
                    },
                    payAction: { label: "Pay invoice" },
                },
            },
        },
        references: {
            client: [
                {
                    entityType: "CLIENT",
                    entityId: "client-2222",
                    ownership: "LINKED",
                    path: "$.data/invoice/client",
                    entity: {
                        name: "Beta Industries",
                        domain: "beta-industries.com",
                    },
                },
            ],
            lineItems: [
                {
                    entityType: "BLOCK",
                    entityId: "li-01",
                    ownership: "OWNED",
                    path: "$.data/lineItems[0]",
                    orderIndex: 0,
                    entity: {
                        payload: {
                            data: {
                                description: "Discovery & planning workshops",
                                quantity: 3,
                                unit: "days",
                                unitPrice: 3200,
                                total: 9600,
                            },
                        },
                    },
                },
                {
                    entityType: "BLOCK",
                    entityId: "li-02",
                    ownership: "OWNED",
                    path: "$.data/lineItems[1]",
                    orderIndex: 1,
                    entity: {
                        payload: {
                            data: {
                                description: "Prototype handoff",
                                quantity: 1,
                                unit: "fixed",
                                unitPrice: 2650,
                                total: 2650,
                            },
                        },
                    },
                },
            ],
        },
    },
};

export const tree = contactTree;
