-- Register the GGJ design theme and make it the platform default.
ALTER TABLE public.platform_settings
  DROP CONSTRAINT IF EXISTS platform_settings_design_theme_check;
ALTER TABLE public.platform_settings
  ADD CONSTRAINT platform_settings_design_theme_check
  CHECK (design_theme IN ('ggj', 'metodic', 'uae'));
UPDATE public.platform_settings SET design_theme = 'ggj' WHERE id = 1;
