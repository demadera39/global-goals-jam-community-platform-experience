import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { fixUserCertificateAccess, fixAllPendingCertificates, CertificateFixResult } from '@/lib/fixCertificateAccess';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
    <div className="min-h-screen bg-gradient-to-b from-primary/5 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Certificate Access Fix Utility</h1>
          <p className="text-muted-foreground">
            Fix certificate access for users who completed the course but have sync issues
          </p>
        </div>

        {/* Single User Fix */}
        <Card>
          <CardHeader>
            <CardTitle>Fix Individual User</CardTitle>
            <CardDescription>
              Enter the user's email address to manually grant certificate access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button onClick={handleFixUser} disabled={loading || !email.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fixing...
                </>
              ) : (
                'Fix Certificate Access'
              )}
            </Button>

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
                      <p className="text-green-600 font-semibold mt-2">
                        ✓ User can now access their certificate at /course/certificate
                      </p>
                    </div>
                  ) : (
                    <p>{result.error}</p>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Bulk Fix */}
        <Card>
          <CardHeader>
            <CardTitle>Fix All Pending Certificates</CardTitle>
            <CardDescription>
              Automatically fix certificate access for all users with 6+ completed modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Bulk Operation</AlertTitle>
              <AlertDescription>
                This will scan all enrollments and update users who have completed 6 or more modules
                but are not marked as completed. This is a safe operation.
              </AlertDescription>
            </Alert>

            <Button onClick={handleFixAll} disabled={bulkLoading}>
              {bulkLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Fix All Pending Certificates'
              )}
            </Button>

            {bulkResults.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Fixed {bulkResults.length} user(s):</h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bulkResults.map((r, idx) => (
                    <Card key={idx}>
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <div className="text-sm space-y-1">
                            <p><strong>{r.displayName}</strong> ({r.email})</p>
                            <p className="text-muted-foreground">
                              Status: {r.previousStatus} → {r.newStatus}
                            </p>
                            <p className="text-muted-foreground">
                              Modules: {r.completedModules.length} completed
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Use</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p><strong>For Antonios Triantafyllakis:</strong></p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Enter his email address in the "Fix Individual User" section above</li>
              <li>Click "Fix Certificate Access"</li>
              <li>Once successful, tell him to refresh and visit /course/certificate</li>
            </ol>

            <p className="mt-4"><strong>For Prevention:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>The certificate page now accepts users with 6+ modules completed (not just 8)</li>
              <li>Enrollment status "active" is now considered valid for certificate access</li>
              <li>Download buttons have improved error handling and loading states</li>
              <li>Signature image now uses reliable Supabase CDN URL</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
