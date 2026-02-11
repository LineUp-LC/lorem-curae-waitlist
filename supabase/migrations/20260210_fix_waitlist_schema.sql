-- ============================================================================
-- WAITLIST SCHEMA FIX MIGRATION
-- ============================================================================
-- This migration adds missing columns identified in the audit:
-- 1. is_creator - differentiate creators from consumers
-- 2. creator_wave_number - wave assignment for creators (C1, C2, C3)
-- 3. segment - "creator" or "regular"
-- 4. updated_at - timestamp for tracking updates
-- ============================================================================

-- Add is_creator column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'is_creator'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN is_creator BOOLEAN NOT NULL DEFAULT false;
        CREATE INDEX idx_waitlist_is_creator ON waitlist (is_creator) WHERE is_creator = true;
    END IF;
END $$;

-- Add creator_wave_number column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'creator_wave_number'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN creator_wave_number INTEGER DEFAULT NULL;
        -- Add check constraint for valid wave numbers (1, 2, 3)
        ALTER TABLE waitlist ADD CONSTRAINT chk_creator_wave_number
            CHECK (creator_wave_number IS NULL OR creator_wave_number IN (1, 2, 3));
    END IF;
END $$;

-- Add segment column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'segment'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN segment TEXT NOT NULL DEFAULT 'regular';
        -- Add check constraint for valid segments
        ALTER TABLE waitlist ADD CONSTRAINT chk_segment
            CHECK (segment IN ('regular', 'creator'));
    END IF;
END $$;

-- Add updated_at column (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'waitlist' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE waitlist ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    END IF;
END $$;

-- Create trigger to auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_waitlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_waitlist_updated_at ON waitlist;
CREATE TRIGGER trigger_waitlist_updated_at
    BEFORE UPDATE ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_waitlist_updated_at();

-- ============================================================================
-- VERIFICATION QUERIES (run these to confirm schema is correct)
-- ============================================================================
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'waitlist'
-- ORDER BY ordinal_position;
