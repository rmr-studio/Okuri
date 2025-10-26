```
{
  "maxDepth": 2,
  "expandRefs": true,
  "root": {
    "block": {
      "id": "11111111-1111-1111-1111-111111111111",
      "name": "Client Overview",
      "organisationId": "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "type": {
        "id": "t-root",
        "key": "client_overview",
        "version": 1,
        "name": "Client Overview",
        "description": "Top-level client profile",
        "archived": false,
        "strictness": "SOFT",
        "system": false,
        "schema": { "name": "Client", "type": "OBJECT", "required": true, "properties": {} },
        "display": {
          "form": { "fields": {} },
          "render": {
            "version": 1,
            "layoutGrid": { "cols": 12, "rowHeight": 32, "items": [] },
            "components": {}
          }
        }
      },
      "payload": {
        "kind": "content",
        "data": {
          "clientId": "c-0001",
          "name": "Jane Doe",
          "email": "jane@acme.com"
        },
        "meta": { "validationErrors": [], "lastValidatedVersion": 1 }
      },
      "archived": false
    },
    "children": {
      "addresses": [
        {
          "block": {
            "id": "22222222-2222-2222-2222-222222222222",
            "name": "Primary Address",
            "organisationId": "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "type": {
              "id": "t-address",
              "key": "address",
              "version": 1,
              "name": "Address",
              "description": "Postal address",
              "archived": false,
              "strictness": "SOFT",
              "system": false,
              "schema": { "name": "Address", "type": "OBJECT", "required": true, "properties": {} },
              "display": {
                "form": { "fields": {} },
                "render": {
                  "version": 1,
                  "layoutGrid": { "cols": 12, "rowHeight": 32, "items": [] },
                  "components": {}
                }
              }
            },
            "payload": {
              "kind": "content",
              "data": {
                "street": "1 Collins St",
                "city": "Melbourne",
                "state": "VIC",
                "postalCode": "3000",
                "country": "AU"
              },
              "meta": { "validationErrors": [], "lastValidatedVersion": 1 }
            },
            "archived": false
          },
          "children": {},
          "warnings": []
        }
      ],
      "company": [
        {
          "block": {
            "id": "33333333-3333-3333-3333-333333333333",
            "name": "Company Link",
            "organisationId": "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            "type": {
              "id": "t-ref",
              "key": "entity_reference",
              "version": 1,
              "name": "Entity Reference",
              "description": "A list of external entity references",
              "archived": false,
              "strictness": "SOFT",
              "system": false,
              "schema": {
                "name": "ReferenceList",
                "type": "OBJECT",
                "required": true,
                "properties": {
                  "items": { "type": "ARRAY", "items": { "type": "OBJECT" } }
                }
              },
              "display": {
                "form": { "fields": {} },
                "render": {
                  "version": 1,
                  "layoutGrid": { "cols": 12, "rowHeight": 32, "items": [] },
                  "components": {}
                }
              }
            },
            "payload": {
              "kind": "references",
              "items": [
                {
                  "type": "COMPANY",
                  "id": "44444444-4444-4444-4444-444444444444"
                }
              ],
              "meta": { "validationErrors": [], "lastValidatedVersion": 1 }
            },
            "archived": false
          },
          "children": {},
          "references": {
            "items": [
              {
                "id": "r-1",
                "entityType": "COMPANY",
                "entityId": "44444444-4444-4444-4444-444444444444",
                "ownership": "LINKED",
                "path": "$.items[0]",
                "orderIndex": 0,
                "blockId": "33333333-3333-3333-3333-333333333333",
                "entity": {
                  "id": "44444444-4444-4444-4444-444444444444",
                  "name": "Acme Pty Ltd",
                  "domain": "acme.com",
                  "archived": false
                }
              }
            ]
          },
          "warnings": []
        }
      ]
    },
    "warnings": []
  }
}
```