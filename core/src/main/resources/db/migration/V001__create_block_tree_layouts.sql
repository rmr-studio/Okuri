-- Migration: Create block_tree_layouts table
-- Description: Stores Gridstack layouts for blocks with support for multiple scopes
--              (organization default, user-specific, team-specific)

-- Create the table
CREATE TABLE IF NOT EXISTS block_tree_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_id UUID NOT NULL,
    organisation_id UUID NOT NULL,
    scope VARCHAR(50) NOT NULL,
    owner_id UUID,
    layout JSONB NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    change_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    -- Foreign key constraints
    CONSTRAINT fk_block_tree_layouts_block
        FOREIGN KEY (block_id)
        REFERENCES blocks(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_block_tree_layouts_organisation
        FOREIGN KEY (organisation_id)
        REFERENCES organisations(id)
        ON DELETE CASCADE,

    -- Ensure scope is valid
    CONSTRAINT chk_block_tree_layouts_scope
        CHECK (scope IN ('ORGANIZATION', 'USER', 'TEAM')),

    -- Ensure only one layout per scope+owner combination
    CONSTRAINT uq_block_scope_owner
        UNIQUE (block_id, scope, owner_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_block_tree_layouts_block_id
    ON block_tree_layouts(block_id);

CREATE INDEX idx_block_tree_layouts_org_id
    ON block_tree_layouts(organisation_id);

CREATE INDEX idx_block_tree_layouts_scope
    ON block_tree_layouts(block_id, scope);

CREATE INDEX idx_block_tree_layouts_owner
    ON block_tree_layouts(block_id, scope, owner_id);

-- GIN index for querying layout structure (JSONB)
CREATE INDEX idx_block_tree_layouts_layout
    ON block_tree_layouts USING GIN (layout);

-- Comments
COMMENT ON TABLE block_tree_layouts IS
    'Stores Gridstack layout configurations for blocks. Supports multiple layouts per block (organization default, user-specific, team-specific).';

COMMENT ON COLUMN block_tree_layouts.block_id IS
    'The block this layout applies to';

COMMENT ON COLUMN block_tree_layouts.scope IS
    'Scope of the layout: ORGANIZATION (default for all users), USER (personalized for one user), or TEAM (shared team layout)';

COMMENT ON COLUMN block_tree_layouts.owner_id IS
    'Owner of the layout based on scope: NULL for ORGANIZATION, user UUID for USER, team UUID for TEAM';

COMMENT ON COLUMN block_tree_layouts.layout IS
    'Complete Gridstack layout from save() including all positioning, dimensions, grid options, and nested sub-grids stored as JSONB';

COMMENT ON COLUMN block_tree_layouts.version IS
    'Version number for tracking layout changes over time';

COMMENT ON COLUMN block_tree_layouts.change_description IS
    'Optional description of what changed in this version';

-- Example queries for common operations:

-- Find organization default layout for a block
-- SELECT * FROM block_tree_layouts
-- WHERE block_id = ? AND scope = 'ORGANIZATION' AND owner_id IS NULL;

-- Find user-specific layout for a block
-- SELECT * FROM block_tree_layouts
-- WHERE block_id = ? AND scope = 'USER' AND owner_id = ?;

-- Batch find layouts with priority (user > org)
-- SELECT DISTINCT ON (block_id) *
-- FROM block_tree_layouts
-- WHERE block_id IN (?, ?, ?)
-- AND organisation_id = ?
-- AND (
--     (scope = 'USER' AND owner_id = ?)
--     OR (scope = 'ORGANIZATION' AND owner_id IS NULL)
-- )
-- ORDER BY block_id,
--     CASE scope
--         WHEN 'USER' THEN 1
--         WHEN 'ORGANIZATION' THEN 2
--     END;
