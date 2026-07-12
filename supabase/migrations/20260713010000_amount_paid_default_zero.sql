-- Fix a misleading default: course_enrollments.amount_paid defaulted to
-- '39.99', so every freshly-created (still unpaid) enrollment looked like it
-- had been paid the full course price. amount_paid must reflect money actually
-- received, which only happens on activation (webhook / verify-course-payment).
--
-- This changes the DEFAULT only. It deliberately does NOT rewrite existing
-- rows: reconciling historical enrollments against Mollie is a separate,
-- explicit step so we never alter real users' financial state unattended.
ALTER TABLE public.course_enrollments ALTER COLUMN amount_paid SET DEFAULT '0';
