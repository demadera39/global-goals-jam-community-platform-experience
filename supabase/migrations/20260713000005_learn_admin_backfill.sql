-- Backfill the Learn platform profile + entitlement for the founder account.
-- New signups get profiles via the on_auth_user_created_learn trigger; this
-- covers the pre-existing auth user.
INSERT INTO public.profiles (id, name, email, role)
SELECT id, 'Marco van Hout', email, 'admin' FROM auth.users
WHERE email = 'demadera@marcovanhout.com'
ON CONFLICT (id) DO UPDATE SET role = 'admin';

INSERT INTO public.entitlements (user_id, product, status)
SELECT id, 'verify-capability', 'active' FROM auth.users
WHERE email = 'demadera@marcovanhout.com'
ON CONFLICT DO NOTHING;
