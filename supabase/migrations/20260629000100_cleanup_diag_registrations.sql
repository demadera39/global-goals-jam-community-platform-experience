-- Remove the throwaway rows created while diagnosing the event_registrations
-- null-id bug (participant_id 'diag' / 'diag2', attached to non-existent events).
DELETE FROM public.event_registrations
WHERE participant_id IN ('diag', 'diag2');
