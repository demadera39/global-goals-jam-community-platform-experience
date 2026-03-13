-- Migrate from Stripe to Mollie payment columns
DO $$
BEGIN
  -- course_enrollments: rename stripe columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='course_enrollments' AND column_name='stripe_session_id') THEN
    ALTER TABLE public.course_enrollments RENAME COLUMN stripe_session_id TO mollie_payment_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='course_enrollments' AND column_name='stripe_payment_intent') THEN
    ALTER TABLE public.course_enrollments DROP COLUMN stripe_payment_intent;
  END IF;

  -- donations: rename stripe columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='donations' AND column_name='stripe_session_id') THEN
    ALTER TABLE public.donations RENAME COLUMN stripe_session_id TO mollie_payment_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='donations' AND column_name='stripe_payment_intent') THEN
    ALTER TABLE public.donations DROP COLUMN stripe_payment_intent;
  END IF;
END $$;
