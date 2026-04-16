-- ============================================================================
-- TEXT OPT-IN MIGRATION
-- ============================================================================
-- Adds text opt-in columns to waitlist and creates config table.
-- Run idempotently via ADD COLUMN IF NOT EXISTS.
-- ============================================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN phone_number TEXT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'text_opt_in'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN text_opt_in BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'text_opt_in_declined'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN text_opt_in_declined BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'text_opt_in_offer_sent_at'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN text_opt_in_offer_sent_at TIMESTAMPTZ NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'waitlist' AND column_name = 'text_opt_in_expires_at'
  ) THEN
    ALTER TABLE waitlist ADD COLUMN text_opt_in_expires_at TIMESTAMPTZ NULL;
  END IF;
END $$;

-- Config table: single row tracking available slots.
CREATE TABLE IF NOT EXISTS text_opt_in_config (
  id SERIAL PRIMARY KEY,
  slots_remaining INTEGER NOT NULL DEFAULT 100
);

-- Seed initial config row if the table is empty.
INSERT INTO text_opt_in_config (slots_remaining)
SELECT 100 WHERE NOT EXISTS (SELECT 1 FROM text_opt_in_config);
