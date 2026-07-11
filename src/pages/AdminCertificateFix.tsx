import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fixUserCertificateAccess, fixAllPendingCertificates, CertificateFixResult } from '@/lib/fixCertificateAccess';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import AdminShell, { adminCardClass, primaryButtonClass } from '@/components/admin/AdminShell';

export default function AdminCertificateFix() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [result, setResult] = useState<CertificateFixResult | null>(null);
  const [bulkResults, setBulkResults] = useState<CertificateFixResult[]>([]);

  const handleFixUser = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const fixResult = await fixUserCertificateAccess(email.trim());
      setResult(fixResult);

      if (fixResult.fixed) {
        toast.success(`Certificate access fixed for ${fixResult.email}`);
      } else {
        toast.error(`Failed to fix certificate access: ${fixResult.error}`);
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      console.error('Error fixing user certificate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFixAll = async () => {
    if (!confirm('This will update all enrollments with 6+ completed modules. Continue?')) {
      return;
    }

    setBulkLoading(true);
    setBulkResults([]);

    try {
      const results = await fixAllPendingCertificates();
      setBulkResults(results);

      if (results.length > 0) {
        toast.success(`Fixed certificate access for ${results.length} user(s)`);
      } else {
        toast.info('No users needed certificate access fixes');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred');
      console.error('Error fixing bulk certificates:', error);
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <AdminShell
      title="Certificate access"
      description="Fix certificate access for users who completed the course but have sync issues."
    >
      <div className="max-w-4xl space-y-6">
        {/* Single User Fix */}
        <div className={`${adminCardClass} p-6`}>
          <h2 className="font-display text-lg font-extrabold text-[#14201a]">Fix individual user</h2>
          <p className="mt-0.5 text-sm text-[#4c5a52]">
            Enter the user's email address to manually grant certificate access.
          </p>
          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[13px] font-semibold text-[#14201a]">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="max-w-sm rounded-full border-[#dfe9e2] bg-white"
              />
            </div>

            <button type="button" className={primaryButtonClass} onClick={handleFixUser} disabled={loading || !email.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Fixing…
                </>
              ) : (
                'Fix certificate access'
              )}
            </button>

            {result && (
              <Alert variant={result.fixed ? 'default' : 'destructive'}>
                {result.fixed ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertTitle>{result.fixed ? 'Success!' : 'Failed'}</AlertTitle>
                <AlertDescription>
                  {result.fixed ? (
                    <div className="space-y-1 text-sm">
                      <p><strong>User:</strong> {result.displayName} ({result.email})</p>
                      <p><strong>Previous Status:</strong> {result.previousStatus}</p>
                      <p><strong>New Status:</strong> {result.newStatus}</p>
                      <p><strong>Completed Modules:</strong> {result.completedModules.join(', ')}</p>
                      <p className="text-primary font-semibold mt-2">
                        ✓ User can now access their certificate at /course/certificate
                      </p>
                    </div>
                  ) : (
                    <p>{result.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Bulk Fix */}
        <div className={`${adminCardClass} p-6`}>
          <h2 className="font-display text-lg font-extrabold text-[#14201a]">Fix all pending certificates</h2>
          <p className="mt-0.5 text-sm text-[#4c5a52]">
            Automatically fix certificate access for all users with 6+ completed modules.
          </p>
          <div className="mt-5 space-y-4">
            <Alert className="rounded-xl border-[#dfe9e2] bg-[#F6FAF7]">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bulk operation</AlertTitle>
              <AlertDescription>
                This will scan all enrollments and update users who have completed 6 or more modules
                but are not marked as completed. This is a safe operation.
              </AlertDescription>
            </Alert>

            <button type="button" className={primaryButtonClass} onClick={handleFixAll} disabled={bulkLoading}>
              {bulkLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing…
                </>
              ) : (
                'Fix all pending certificates'
              )}
            </button>

            {bulkResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#14201a]">
                  Fixed <span className="font-mono tabular-nums">{bulkResults.length}</span> user(s):
                </h3>
                <ul className="max-h-96 divide-y divide-[#dfe9e2] overflow-y-auto rounded-xl border border-[#dfe9e2]">
                  {bulkResults.map((r, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-white px-4 py-3">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#00A651]" />
                      <div className="space-y-0.5 text-sm">
                        <p className="font-semibold text-[#14201a]">{r.displayName} <span className="font-normal text-[#7d8a83]">({r.email})</span></p>
                        <p className="text-[13px] text-[#4c5a52]">Status: {r.previousStatus} → {r.newStatus}</p>
                        <p className="text-[13px] text-[#4c5a52]">Modules: <span className="font-mono tabular-nums">{r.completedModules.length}</span> completed</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className={`${adminCardClass} p-6`}>
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-[#00713a]">How to use</p>
          <div className="mt-4 space-y-2 text-sm text-[#4c5a52]">
            <p className="font-semibold text-[#14201a]">For a specific user:</p>
            <ol className="ml-4 list-inside list-decimal space-y-1">
              <li>Enter their email address in the "Fix individual user" section above</li>
              <li>Click "Fix certificate access"</li>
              <li>Once successful, tell them to refresh and visit /course/certificate</li>
            </ol>

            <p className="mt-4 font-semibold text-[#14201a]">For prevention:</p>
            <ul className="ml-4 list-inside list-disc space-y-1">
              <li>The certificate page now accepts users with 6+ modules completed (not just 8)</li>
              <li>Enrollment status "active" is now considered valid for certificate access</li>
              <li>Download buttons have improved error handling and loading states</li>
              <li>Signature image now uses reliable Supabase CDN URL</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
