-- 1. Replace permissive "true" INSERT policy on bookings with a sane field check
DROP POLICY IF EXISTS "Anyone can submit booking" ON public.bookings;
CREATE POLICY "Public can submit booking with required fields"
ON public.bookings FOR INSERT TO anon, authenticated
WITH CHECK (
  email IS NOT NULL AND length(email) > 3
  AND equipment IS NOT NULL AND length(equipment) > 0
  AND full_name IS NOT NULL AND length(full_name) > 0
);

-- 2. Lock down storage.objects listing on site-images bucket (CDN public URLs still work)
DROP POLICY IF EXISTS "Public read site images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read site images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read site images" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;

CREATE POLICY "Admins manage site-images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

-- 3. Revoke EXECUTE on security-definer helpers from public/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_notify_booking_status() FROM PUBLIC, anon, authenticated;