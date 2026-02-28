import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, Shield, Info, CheckCircle } from 'lucide-react';
import { getSupabaseFunctionUrl } from '@/lib/supabase-functions';
import toast from 'react-hot-toast';
import blink from '@/lib/blink';

export default function MigratePage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleMigrate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter your email and a new password');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(getSupabaseFunctionUrl('migrate-user'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError('No account found with this email. Please check your email or sign up.');
        } else if (data.message?.includes('already uses email/password')) {
          setError(data.message);
          setTimeout(() => { window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}` }, 2000);
        } else {
          setError(data.error || 'Migration failed. Please try again.');
        }
        return;
      }

      if (data.success && data.migrated) {
        setSuccess(true);
        toast.success('Account migrated successfully! Redirecting to login...');
        setTimeout(() => {
          window.location.href = `/sign-in?redirect=${encodeURIComponent('/profile')}`
        }, 2000);
      } else {
        setError(data.message || 'Unable to migrate account');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-800">Migration Successful!</h2>
              <p className="text-gray-600">
                Your account has been successfully migrated to email/password authentication.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting you to the login page...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-green-600" />
            <CardTitle className="text-2xl">Set Your Password</CardTitle>
          </div>
          <CardDescription>
            Since you previously signed in with Google or GitHub, you need to set a password for your account to continue using email authentication.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Alert className="mb-4 border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800">
              This is a one-time setup. After setting your password, you'll be able to log in with your email and password.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleMigrate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                Use the same email you used with Google/GitHub
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
              <p className="text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                minLength={8}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>Setting up password...</>
              ) : (
                <>
                  Set Password and Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-gray-500">
            Already set your password?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal text-green-600 hover:text-green-700"
              onClick={() => { window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.href)}` }}
            >
              Go to Login
            </Button>
          </div>
          <div className="text-center text-sm text-gray-500">
            Don't have an account?{' '}
            <Button
              variant="link"
              className="p-0 h-auto font-normal text-green-600 hover:text-green-700"
              onClick={() => navigate('/signup')}
            >
              Sign Up
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}