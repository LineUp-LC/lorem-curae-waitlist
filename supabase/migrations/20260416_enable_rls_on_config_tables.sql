-- Enable RLS and add public read policies on config tables.
-- Service role bypasses RLS so API functions retain full write access.

ALTER TABLE public.text_opt_in_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.text_opt_in_config FOR SELECT USING (true);

ALTER TABLE public.valid_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.valid_roles FOR SELECT USING (true);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON public.feature_flags FOR SELECT USING (true);
