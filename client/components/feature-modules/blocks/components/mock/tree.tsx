import { BlockTree } from "@/components/feature-modules/blocks/interface/block.interface";

export const tree: BlockTree = {
    root: {
        block: {
            id: "11111111-1111-1111-1111-111111111111",
            type: { key: "contact", version: 3 },
            payload: {
                data: {
                    name: "Jane Doe",
                    email: "jane@acme.com",
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
                    path: "$.data/account",
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
                                line1: "1 Collins St",
                                city: "Melbourne",
                                postCode: "3000",
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
                                line1: "2 George St",
                                city: "Sydney",
                                postCode: "2000",
                                country: "AU",
                            },
                        },
                    },
                },
            ],
        },
    },
};
