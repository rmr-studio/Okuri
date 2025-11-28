-- ===========================================================================
-- Okuri System Block Types - Database Seeding Script
-- ===========================================================================
-- This script populates the block_types table with system-defined block types
-- that are available across all organizations.
--
-- IMPORTANT: Run this script manually after setting up the database.
--
-- Block Types Included:
--   1. layout_container - Hosts nested blocks in a grid-aware surface
--   2. block_list - Renders a homogeneous list of owned child blocks
--   3. content_block_list - Ordered list with configurable ordering
--   4. block_reference - Embeds contents of another block tree
--   5. entity_reference_list - References a list of external entities
-- ===========================================================================

-- Layout Container Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('130db1d2-2a8e-4f20-8c3d-07e69fe503c5'::uuid,
        'layout_container',
        NULL,
        'Layout Container',
        'Hosts nested blocks inside a grid-aware surface.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "LayoutContainer",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "title": {
              "name": "Title",
              "type": "STRING",
              "required": false
            },
            "description": {
              "name": "Description",
              "type": "STRING",
              "required": false
            }
          }
        }'::jsonb,
        false,
        '{
          "max": null,
          "allowedTypes": [
            "CONTACT_CARD",
            "LAYOUT_CONTAINER",
            "ADDRESS_CARD",
            "LINE_ITEM",
            "TABLE",
            "TEXT",
            "IMAGE",
            "BUTTON",
            "ATTACHMENT"
          ]
        }'::jsonb,
        '{
          "form": {
            "fields": {
              "data.title": {
                "type": "TEXT_INPUT",
                "label": "Container Title",
                "placeholder": "Enter container title"
              },
              "data.description": {
                "type": "TEXT_AREA",
                "label": "Description",
                "placeholder": "Describe this container"
              }
            }
          },
          "render": {
            "version": 1,
            "layoutGrid": {
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              },
              "items": [
                {
                  "id": "layout",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 8,
                    "locked": false
                  }
                }
              ]
            },
            "components": {
              "layout": {
                "id": "layout",
                "type": "LAYOUT_CONTAINER",
                "props": {
                  "variant": "card",
                  "padded": true
                },
                "bindings": [
                  {
                    "prop": "title",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/title"
                    }
                  },
                  {
                    "prop": "description",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/description"
                    }
                  }
                ],
                "slots": {
                  "main": [
                    "*"
                  ]
                },
                "slotLayout": {
                  "main": {
                    "layout": {
                      "x": 0,
                      "y": 0,
                      "width": 12,
                      "height": 4,
                      "locked": false
                    },
                    "items": []
                  }
                },
                "fetchPolicy": "LAZY"
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- Block List Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('e3202dc4-5087-46c5-8b0c-28caad84c573'::uuid,
        'block_list',
        NULL,
        'Block List',
        'Renders a homogeneous list of owned child blocks.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "BlockList",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "title": {
              "name": "Title",
              "type": "STRING",
              "required": false
            },
            "description": {
              "name": "Description",
              "type": "STRING",
              "required": false
            },
            "emptyMessage": {
              "name": "Empty message",
              "type": "STRING",
              "required": false
            }
          }
        }'::jsonb,
        false,
        '{
          "max": 100,
          "allowedTypes": [
            "CONTACT_CARD",
            "LAYOUT_CONTAINER",
            "ADDRESS_CARD",
            "LINE_ITEM",
            "TABLE",
            "TEXT",
            "IMAGE",
            "BUTTON",
            "ATTACHMENT"
          ]
        }'::jsonb,
        '{
          "form": {
            "fields": {
              "data.title": {
                "type": "TEXT_INPUT",
                "label": "List Title",
                "placeholder": "Enter list title"
              },
              "data.description": {
                "type": "TEXT_AREA",
                "label": "Description",
                "placeholder": "Describe this list"
              },
              "data.emptyMessage": {
                "type": "TEXT_INPUT",
                "label": "Empty Message",
                "placeholder": "Message shown when list is empty"
              }
            }
          },
          "render": {
            "version": 1,
            "layoutGrid": {
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              },
              "items": [
                {
                  "id": "list",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 8,
                    "locked": false
                  }
                }
              ]
            },
            "components": {
              "list": {
                "id": "list",
                "type": "LINE_ITEM",
                "props": {
                  "title": "List",
                  "emptyMessage": "Add an item",
                  "itemComponent": "ADDRESS_CARD"
                },
                "bindings": [
                  {
                    "prop": "title",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/title"
                    }
                  },
                  {
                    "prop": "description",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/description"
                    }
                  },
                  {
                    "prop": "emptyMessage",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/emptyMessage"
                    }
                  }
                ],
                "fetchPolicy": "LAZY"
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- Content Block List Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('4655c164-18cb-4a38-ab5e-04c43acafa42'::uuid,
        'content_block_list',
        NULL,
        'Content Block List',
        'Ordered list of content blocks with configurable ordering.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "ContentBlockList",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "title": {
              "name": "Title",
              "type": "STRING",
              "required": false
            },
            "description": {
              "name": "Description",
              "type": "STRING",
              "required": false
            }
          }
        }'::jsonb,
        false,
        '{
          "max": null,
          "allowedTypes": [
            "project_task"
          ]
        }'::jsonb,
        '{
          "form": {
            "fields": {
              "data.title": {
                "type": "TEXT_INPUT",
                "label": "List Title",
                "placeholder": "Enter list title"
              },
              "data.description": {
                "type": "TEXT_AREA",
                "label": "Description",
                "placeholder": "Describe this list"
              }
            }
          },
          "render": {
            "version": 1,
            "layoutGrid": {
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              },
              "items": [
                {
                  "id": "contentList",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 8,
                    "locked": false
                  }
                }
              ]
            },
            "components": {
              "contentList": {
                "id": "contentList",
                "type": "LAYOUT_CONTAINER",
                "props": {
                  "variant": "list",
                  "padded": false
                },
                "bindings": [
                  {
                    "prop": "title",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/title"
                    }
                  },
                  {
                    "prop": "description",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/description"
                    }
                  }
                ],
                "slots": {
                  "items": [
                    "*"
                  ]
                },
                "fetchPolicy": "LAZY"
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- Block Reference Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('151b6bc8-6aca-47d8-8876-61dc2483e683'::uuid,
        'block_reference',
        NULL,
        'Embedded Block Reference',
        'Embeds the contents of another block tree.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "BlockReference",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "placeholder": {
              "name": "Placeholder",
              "type": "STRING",
              "required": false
            }
          }
        }'::jsonb,
        false,
        NULL,
        '{
          "form": {
            "fields": {}
          },
          "render": {
            "version": 1,
            "layoutGrid": {
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              },
              "items": [
                {
                  "id": "reference",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 8,
                    "locked": false
                  }
                }
              ]
            },
            "components": {
              "reference": {
                "id": "reference",
                "type": "TEXT",
                "props": {
                  "text": "Referenced block placeholder",
                  "variant": "muted"
                },
                "bindings": [
                  {
                    "prop": "text",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/placeholder"
                    }
                  }
                ],
                "fetchPolicy": "LAZY"
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- Entity Reference List Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('b5df1b11-a9d5-423a-b23a-ce21a89a0b6a'::uuid,
        'entity_reference_list',
        NULL,
        'Entity Reference List',
        'References a list of external entities.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "EntityReferenceList",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "title": {
              "name": "Title",
              "type": "STRING",
              "required": false
            },
            "emptyMessage": {
              "name": "Empty message",
              "type": "STRING",
              "required": false
            }
          }
        }'::jsonb,
        false,
        NULL,
        '{
          "form": {
            "fields": {}
          },
          "render": {
            "version": 1,
            "layoutGrid": {
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              },
              "items": [
                {
                  "id": "entities",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 8,
                    "locked": false
                  }
                }
              ]
            },
            "components": {
              "entities": {
                "id": "entities",
                "type": "TEXT",
                "props": {
                  "text": "Entity reference list placeholder",
                  "variant": "muted"
                },
                "bindings": [
                  {
                    "prop": "text",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/emptyMessage"
                    }
                  }
                ],
                "fetchPolicy": "LAZY"
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- Note Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('f6a7b8c9-d0e1-2345-f678-901234567890'::uuid,
        'note',
        NULL,
        'Note',
        'Simple rich text note.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "Note",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "content": {
              "name": "Content",
              "type": "STRING",
              "required": true
            }
          }
        }'::jsonb,
        false,
        NULL,
        '{
          "form": {
            "fields": {
              "data.content": {
                "type": "TEXT_AREA",
                "label": "Note Content",
                "placeholder": "Start typing your note..."
              }
            }
          },
          "render": {
            "version": 1,
            "components": {
              "note": {
                "id": "note",
                "type": "TEXT",
                "props": {
                  "variant": "body",
                  "placeholder": "Click to add note content..."
                },
                "bindings": [
                  {
                    "prop": "text",
                    "source": {
                      "path": "$.data/content",
                      "type": "DataPath"
                    }
                  }
                ],
                "fetchPolicy": "LAZY"
              }
            },
            "layoutGrid": {
              "items": [
                {
                  "id": "note",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 4,
                    "locked": false
                  }
                }
              ],
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- Task Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('a7b8c9d0-e1f2-3456-7890-123456789abc'::uuid,
        'project_task',
        NULL,
        'Project Task',
        'Individual task item for a project.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "Task",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "title": {
              "name": "Title",
              "type": "STRING",
              "required": true
            },
            "assignee": {
              "name": "Assignee",
              "type": "STRING",
              "required": false
            },
            "status": {
              "name": "Status",
              "type": "STRING",
              "required": false
            },
            "dueDate": {
              "name": "Due date",
              "type": "STRING",
              "required": false,
              "format": "DATE"
            }
          }
        }'::jsonb,
        false,
        NULL,
        '{
          "form": {
            "fields": {
              "data.title": {
                "type": "TEXT_INPUT",
                "label": "Task Title",
                "placeholder": "Enter task title"
              },
              "data.assignee": {
                "type": "TEXT_INPUT",
                "label": "Assignee",
                "placeholder": "Who is responsible?"
              },
              "data.status": {
                "type": "DROPDOWN",
                "label": "Status",
                "options": [
                  {
                    "label": "Not Started",
                    "value": "NOT_STARTED"
                  },
                  {
                    "label": "In Progress",
                    "value": "IN_PROGRESS"
                  },
                  {
                    "label": "In Review",
                    "value": "IN_REVIEW"
                  },
                  {
                    "label": "Completed",
                    "value": "COMPLETED"
                  }
                ]
              },
              "data.dueDate": {
                "type": "DATE_PICKER",
                "label": "Due Date",
                "placeholder": "Select due date"
              }
            }
          },
          "render": {
            "version": 1,
            "layoutGrid": {
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              },
              "items": [
                {
                  "id": "task",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 4,
                    "locked": false
                  }
                }
              ]
            },
            "components": {
              "task": {
                "id": "task",
                "type": "TEXT",
                "props": {
                  "variant": "body"
                },
                "bindings": [
                  {
                    "prop": "text",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/title"
                    }
                  }
                ],
                "fetchPolicy": "LAZY"
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- Postal Address Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('b8c9d0e1-f2a3-4567-8901-23456789abcd'::uuid,
        'postal_address',
        NULL,
        'Postal Address',
        'Physical address for a contact or organisation.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "Address",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "title": {
              "name": "Title",
              "type": "STRING",
              "required": false
            },
            "description": {
              "name": "Description",
              "type": "STRING",
              "required": false
            },
            "address": {
              "name": "Address",
              "type": "OBJECT",
              "required": true,
              "properties": {
                "street": {
                  "name": "Street",
                  "type": "STRING",
                  "required": true
                },
                "city": {
                  "name": "City",
                  "type": "STRING",
                  "required": true
                },
                "state": {
                  "name": "State",
                  "type": "STRING",
                  "required": true
                },
                "postalCode": {
                  "name": "Postal Code",
                  "type": "STRING",
                  "required": true
                },
                "country": {
                  "name": "Country",
                  "type": "STRING",
                  "required": true
                }
              }
            }
          }
        }'::jsonb,
        false,
        NULL,
        '{
          "form": {
            "fields": {
              "data.title": {
                "type": "TEXT_INPUT",
                "label": "Title",
                "placeholder": "e.g., Home, Office"
              },
              "data.description": {
                "type": "TEXT_AREA",
                "label": "Description",
                "placeholder": "Additional address notes"
              },
              "data.address.street": {
                "type": "TEXT_INPUT",
                "label": "Street Address",
                "placeholder": "123 Main St"
              },
              "data.address.city": {
                "type": "TEXT_INPUT",
                "label": "City",
                "placeholder": "San Francisco"
              },
              "data.address.state": {
                "type": "TEXT_INPUT",
                "label": "State/Province",
                "placeholder": "CA"
              },
              "data.address.postalCode": {
                "type": "TEXT_INPUT",
                "label": "Postal Code",
                "placeholder": "94102"
              },
              "data.address.country": {
                "type": "TEXT_INPUT",
                "label": "Country",
                "placeholder": "USA"
              }
            }
          },
          "render": {
            "version": 1,
            "layoutGrid": {
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              },
              "items": [
                {
                  "id": "addressCard",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "locked": false
                  }
                }
              ]
            },
            "components": {
              "addressCard": {
                "id": "addressCard",
                "type": "ADDRESS_CARD",
                "props": {},
                "bindings": [
                  {
                    "prop": "title",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/title"
                    }
                  },
                  {
                    "prop": "description",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/description"
                    }
                  },
                  {
                    "prop": "address",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/address"
                    }
                  }
                ],
                "fetchPolicy": "LAZY"
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- Project Overview Block Type
INSERT INTO block_types (id,
                         key,
                         source_id,
                         display_name,
                         description,
                         organisation_id,
                         system,
                         version,
                         strictness,
                         schema,
                         archived,
                         nesting,
                         display_structure,
                         created_at,
                         updated_at)
VALUES ('c9d0e1f2-a3b4-5678-9012-3456789abcde'::uuid,
        'project_overview',
        NULL,
        'Project Overview',
        'High-level project summary block.',
        NULL,
        true,
        1,
        'SOFT',
        '{
          "name": "ProjectOverview",
          "type": "OBJECT",
          "required": true,
          "properties": {
            "name": {
              "name": "Name",
              "type": "STRING",
              "required": true
            },
            "status": {
              "name": "Status",
              "type": "STRING",
              "required": false
            },
            "summary": {
              "name": "Summary",
              "type": "STRING",
              "required": false
            }
          }
        }'::jsonb,
        false,
        '{
          "max": null,
          "allowedTypes": [
            "CONTACT_CARD",
            "LAYOUT_CONTAINER",
            "ADDRESS_CARD",
            "LINE_ITEM",
            "TABLE",
            "TEXT",
            "IMAGE",
            "BUTTON",
            "ATTACHMENT"
          ]
        }'::jsonb,
        '{
          "form": {
            "fields": {
              "data.name": {
                "type": "TEXT_INPUT",
                "label": "Project Name",
                "placeholder": "Enter project name"
              },
              "data.status": {
                "type": "DROPDOWN",
                "label": "Project Status",
                "options": [
                  {
                    "label": "Planning",
                    "value": "Planning"
                  },
                  {
                    "label": "In Progress",
                    "value": "In progress"
                  },
                  {
                    "label": "On Hold",
                    "value": "On hold"
                  },
                  {
                    "label": "Completed",
                    "value": "Completed"
                  },
                  {
                    "label": "Cancelled",
                    "value": "Cancelled"
                  }
                ]
              },
              "data.summary": {
                "type": "TEXT_AREA",
                "label": "Project Summary",
                "placeholder": "Describe the project..."
              }
            }
          },
          "render": {
            "version": 1,
            "layoutGrid": {
              "layout": {
                "x": 0,
                "y": 0,
                "width": 12,
                "height": 4,
                "locked": false
              },
              "items": [
                {
                  "id": "summary",
                  "rect": {
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "locked": false
                  }
                }
              ]
            },
            "components": {
              "summary": {
                "id": "summary",
                "type": "TEXT",
                "props": {
                  "variant": "body"
                },
                "bindings": [
                  {
                    "prop": "text",
                    "source": {
                      "type": "DataPath",
                      "path": "$.data/summary"
                    }
                  }
                ],
                "fetchPolicy": "LAZY"
              }
            }
          }
        }'::jsonb,
        NOW(),
        NOW());

-- ===========================================================================
-- Verification Query
-- ===========================================================================
-- Run this after executing the script to verify all types were inserted:
--
-- SELECT key, display_name, system, version
-- FROM block_types
-- WHERE system = true
-- ORDER BY key;
--
-- Expected results: 9 rows with keys:
--   - block_list
--   - block_reference
--   - content_block_list
--   - entity_reference_list
--   - layout_container
--   - note
--   - postal_address
--   - project_overview
--   - project_task
-- ===========================================================================
