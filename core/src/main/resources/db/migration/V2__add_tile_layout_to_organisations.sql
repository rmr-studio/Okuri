-- Add tile_layout column to organisations table
-- This column stores the JSON configuration for custom organisation tile layouts

ALTER TABLE organisations 
ADD COLUMN tile_layout JSONB;

-- Add a comment to document the column purpose
COMMENT ON COLUMN organisations.tile_layout IS 'JSON configuration for custom organisation tile layout including sections, visibility settings, and positioning';

-- Create an index for better query performance when filtering by tile layout settings
CREATE INDEX idx_organisations_tile_layout ON organisations USING GIN (tile_layout);

-- Add a check constraint to ensure the JSON structure is valid
ALTER TABLE organisations 
ADD CONSTRAINT check_tile_layout_structure 
CHECK (
    tile_layout IS NULL OR (
        tile_layout ? 'sections' AND 
        tile_layout ? 'showAvatar' AND 
        tile_layout ? 'showPlan' AND 
        tile_layout ? 'showMemberCount' AND 
        tile_layout ? 'showMemberSince' AND 
        tile_layout ? 'showRole' AND 
        tile_layout ? 'showCustomAttributes' AND 
        tile_layout ? 'showAddress' AND 
        tile_layout ? 'showPaymentInfo' AND 
        tile_layout ? 'showBusinessNumber' AND 
        tile_layout ? 'showTaxId'
    )
);
