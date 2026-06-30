
-- 1) Update bookings: new status workflow + customer linkage
UPDATE public.bookings SET status = 'pending' WHERE status = 'new';
UPDATE public.bookings SET status = 'approved' WHERE status = 'invoiced';
UPDATE public.bookings SET status = 'completed' WHERE status = 'closed';

ALTER TABLE public.bookings ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS customer_user_id uuid;
CREATE INDEX IF NOT EXISTS idx_bookings_customer_user ON public.bookings(customer_user_id);

-- Allow signed-in customers to view their own bookings
DROP POLICY IF EXISTS "Customers view own bookings" ON public.bookings;
CREATE POLICY "Customers view own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (customer_user_id = auth.uid());

-- 2) Rentals (admin-managed fleet)
CREATE TABLE IF NOT EXISTS public.rentals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  description text,
  image_url text,
  day_rate numeric NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active rentals" ON public.rentals
  FOR SELECT TO anon, authenticated USING (active OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert rentals" ON public.rentals
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update rentals" ON public.rentals
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete rentals" ON public.rentals
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER rentals_updated_at BEFORE UPDATE ON public.rentals
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed default fleet
INSERT INTO public.rentals (name, category, description, day_rate, position) VALUES
  ('Industrial Air Compressor — 750 cfm','Compressors','Field-serviced, crew optional', 850, 1),
  ('Diesel Generator 500 kVA','Power','Continuous duty, 24/7 standby capable', 1200, 2),
  ('API 5L Line Pipe Spreads — 12"','OCTG','Certified pipe spreads, full traceability', 320, 3),
  ('Centrifugal Process Pump','Pumps','High-capacity process pump, multiple sizes', 480, 4),
  ('Gas Filtration Skid','Gas Processing','Filters and dehydrates wellhead gas', 990, 5),
  ('Refrigerated Air Dryer','Compressors','Pairs with compressors for dry air supply', 270, 6)
ON CONFLICT DO NOTHING;

-- 3) Notifications (in-app)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR user_id = auth.uid());
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);

-- 4) Auto-notify on booking status change
CREATE OR REPLACE FUNCTION public.tg_notify_booking_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg text;
  ttl text;
BEGIN
  IF NEW.customer_user_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.status = OLD.status THEN RETURN NEW; END IF;

  CASE NEW.status
    WHEN 'pending'   THEN ttl := 'Booking received'; msg := 'Your request for ' || NEW.equipment || ' is pending review.';
    WHEN 'approved'  THEN ttl := 'Booking approved 🎉'; msg := 'We approved your rental of ' || NEW.equipment || '. Our team will follow up with the invoice.';
    WHEN 'rejected'  THEN ttl := 'Booking rejected'; msg := 'Unfortunately we cannot fulfill your request for ' || NEW.equipment || ' at this time.';
    WHEN 'completed' THEN ttl := 'Booking completed ✓'; msg := 'Your rental of ' || NEW.equipment || ' is now marked completed. Thank you!';
    ELSE ttl := 'Booking update'; msg := 'Your booking for ' || NEW.equipment || ' is now ' || NEW.status || '.';
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (NEW.customer_user_id, NEW.status, ttl, msg, '/portal');

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS bookings_notify_status ON public.bookings;
CREATE TRIGGER bookings_notify_status
AFTER INSERT OR UPDATE OF status ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_booking_status();

-- 5) Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
