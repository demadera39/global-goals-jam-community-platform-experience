-- Module gating: v18 tables (module_opens rhythm-unlock timestamps,
-- module_overrides admin unlocks) + RLS. Created locally via psql during
-- the fork bring-up; codified here so fresh/production databases get them.

CREATE TABLE public.module_opens (
    user_id uuid NOT NULL,
    module_id text NOT NULL,
    opened_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.module_opens OWNER TO postgres;
CREATE TABLE public.module_overrides (
    user_id uuid NOT NULL,
    module_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.module_overrides OWNER TO postgres;
ALTER TABLE ONLY public.module_opens
    ADD CONSTRAINT module_opens_pkey PRIMARY KEY (user_id, module_id);
ALTER TABLE ONLY public.module_overrides
    ADD CONSTRAINT module_overrides_pkey PRIMARY KEY (user_id, module_id);
ALTER TABLE ONLY public.module_opens
    ADD CONSTRAINT module_opens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.module_overrides
    ADD CONSTRAINT module_overrides_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.module_opens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "module_opens: insert own rows" ON public.module_opens FOR INSERT WITH CHECK ((auth.uid() = user_id));
CREATE POLICY "module_opens: select own rows" ON public.module_opens FOR SELECT USING ((auth.uid() = user_id));
ALTER TABLE public.module_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "module_overrides: select own rows" ON public.module_overrides FOR SELECT USING ((auth.uid() = user_id));
GRANT ALL ON TABLE public.module_opens TO anon;
GRANT ALL ON TABLE public.module_opens TO authenticated;
GRANT ALL ON TABLE public.module_opens TO service_role;
GRANT ALL ON TABLE public.module_overrides TO anon;
GRANT ALL ON TABLE public.module_overrides TO authenticated;
GRANT ALL ON TABLE public.module_overrides TO service_role;

ALTER TABLE public.module_opens ENABLE ROW LEVEL SECURITY; ALTER TABLE public.module_overrides ENABLE ROW LEVEL SECURITY;
