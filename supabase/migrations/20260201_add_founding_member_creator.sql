-- Add is_founding_member_creator column (separate pool, cap 20)
-- This is independent from is_founding_member (general pool, cap 50)
ALTER TABLE waitlist ADD COLUMN is_founding_member_creator BOOLEAN NOT NULL DEFAULT false;

-- Partial index for efficient cap-check count queries
CREATE INDEX idx_waitlist_founding_member_creator ON waitlist (is_founding_member_creator) WHERE is_founding_member_creator = true;
