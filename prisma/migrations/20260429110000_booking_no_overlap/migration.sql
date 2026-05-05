-- Exclusion constraint: no two CONFIRMED bookings can overlap on the same location.
-- Caught at DB layer (errcode 23P01); app maps to ConflictError.
--
-- Postgres rejects tstzrange() in index expressions even via IMMUTABLE wrappers
-- (timezone-dependence concern). Workaround: a plain `during` tstzrange column maintained
-- by a BEFORE INSERT/UPDATE trigger; exclusion uses the column directly.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking" ADD COLUMN "during" tstzrange;

CREATE OR REPLACE FUNCTION booking_set_during() RETURNS trigger
  LANGUAGE plpgsql AS $$
BEGIN
  NEW."during" := tstzrange(NEW."startsAt", NEW."endsAt", '[)');
  RETURN NEW;
END $$;

CREATE TRIGGER booking_during_trg
  BEFORE INSERT OR UPDATE OF "startsAt", "endsAt" ON "Booking"
  FOR EACH ROW EXECUTE FUNCTION booking_set_during();

UPDATE "Booking" SET "during" = tstzrange("startsAt", "endsAt", '[)');
ALTER TABLE "Booking" ALTER COLUMN "during" SET NOT NULL;

ALTER TABLE "Booking"
  ADD CONSTRAINT booking_no_overlap
  EXCLUDE USING gist (
    "locationId" WITH =,
    "during" WITH &&
  )
  WHERE (status = 'CONFIRMED');
