-- Weekly editorial content agent: pg_cron → weekly-editorial edge function,
-- every Tuesday 07:00 UTC (09:00 Amsterdam in summer). The shared run key is
-- read from Vault (secret name: editorial_run_key) so it never sits in the
-- cron command text; the same value is set as the EDITORIAL_RUN_KEY edge secret.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('weekly-editorial') where exists (select 1 from cron.job where jobname = 'weekly-editorial');
select cron.schedule(
  'weekly-editorial',
  '0 7 * * 2',
  $cron$
  select net.http_post(
    url := 'https://kzeoegabvbaonypooaev.supabase.co/functions/v1/weekly-editorial',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-editorial-key', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'editorial_run_key' limit 1), '')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
