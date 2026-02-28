# Global Goals Jam Community Platform

(abridged project README)

## Automated Disk Cleanup & Monitor

We've added an automated helper to detect and remediate disk space shortages which previously caused save_version failures (ENOSPC). Files added:

- scripts/auto-disk-monitor.cjs - checks root disk usage and runs cleanup-environment.sh when threshold is reached. Creates a marker file `.disk_cleanup_succeeded` on success.
- scripts/cleanup-environment.sh - existing cleanup helper (already present), now used by the monitor script.

How to use:

- Manual check (dry-run):
  node scripts/auto-disk-monitor.cjs --dry-run --threshold=85

- Automatic fix (run cleanup if above threshold):
  node scripts/auto-disk-monitor.cjs --fix --threshold=90

Suggested automation (CI / cron):

- Add a cronjob on the host or a CI pre-build step that runs the auto-disk-monitor before heavy build/save operations. Example (cron every 10 minutes):

  */10 * * * * cd /path/to/project && /usr/bin/node scripts/auto-disk-monitor.cjs --fix

Notes:
- The monitor will attempt to run cleanup-environment.sh and then run `node scripts/backup-system.cjs clean` to remove repo caches. It writes a small marker file `.disk_cleanup_succeeded` when successful.
- The cleanup script uses sudo for some operations; configure CI runner privileges appropriately.

