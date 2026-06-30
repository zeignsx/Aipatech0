
-- Table for editable site images
CREATE TABLE public.site_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  url text,
  alt text,
  label text,
  category text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

ALTER TABLE public.site_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site images"
  ON public.site_images FOR SELECT
  USING (true);

CREATE POLICY "Admins insert site images"
  ON public.site_images FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update site images"
  ON public.site_images FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete site images"
  ON public.site_images FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_site_images_updated_at
  BEFORE UPDATE ON public.site_images
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed editable slots
INSERT INTO public.site_images (key, label, category, alt) VALUES
  ('hero_main',       'Homepage Hero',         'Homepage', 'Offshore oil rig at sunset'),
  ('home_mosaic_1',   'Mosaic — Refinery',     'Homepage', 'Nigerian refinery flare stacks at dusk'),
  ('home_mosaic_2',   'Mosaic — Pipes',        'Homepage', 'API 5L line pipe stacks'),
  ('home_mosaic_3',   'Mosaic — FPSO',         'Homepage', 'FPSO offshore Nigeria'),
  ('home_mosaic_4',   'Mosaic — LNG',          'Homepage', 'NLNG terminal'),
  ('home_services_bg','Services background',   'Homepage', 'Nigerian oil & gas engineers'),
  ('home_cta_bg',     'CTA banner',            'Homepage', 'FPSO offshore Nigeria'),
  ('rentals_compressor', 'Rentals — Compressor','Rentals', 'Industrial air compressor'),
  ('rentals_generator',  'Rentals — Generator', 'Rentals', 'Diesel generator'),
  ('rentals_pipe',       'Rentals — Pipe',      'Rentals', 'API 5L line pipe'),
  ('rentals_pump',       'Rentals — Pump',      'Rentals', 'Centrifugal process pump'),
  ('rentals_gas',        'Rentals — Gas Skid',  'Rentals', 'Gas filtration skid'),
  ('rentals_dryer',      'Rentals — Air Dryer', 'Rentals', 'Refrigerated air dryer');

-- Storage bucket for the actual files
INSERT INTO storage.buckets (id, name, public) VALUES ('site-images', 'site-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read site-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');

CREATE POLICY "Admins upload site-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update site-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete site-images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'site-images' AND public.has_role(auth.uid(), 'admin'));
