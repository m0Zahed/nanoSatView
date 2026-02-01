import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { postJson } from '@/app/auth/api';
import { useAuth } from '@/app/auth/AuthContext';

export function CompleteProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth ?? '');
  const [picturePreview, setPicturePreview] = useState<string | null>(user?.pictureUrl ?? null);
  const [pictureDataUrl, setPictureDataUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.profileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handlePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPicturePreview(user?.pictureUrl ?? null);
      setPictureDataUrl(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      setPicturePreview(result);
      setPictureDataUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        fullName,
        username,
        dateOfBirth,
        pictureUrl: pictureDataUrl ?? picturePreview,
      };
      if (password) {
        payload.password = password;
      }
      const { status, data } = await postJson('/auth/profile', payload);
      if (status === 200) {
        await refreshUser();
        navigate('/dashboard');
        return;
      }
      const message =
        data && typeof data === 'object' && 'error' in data
          ? ((data as { error: { message?: string } }).error?.message ?? 'Profile update failed.')
          : 'Profile update failed.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Complete your profile</CardTitle>
          <CardDescription>
            Add the required details to finish setting up your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">3-20 characters, letters/numbers/underscore.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="picture">Profile Picture (optional)</Label>
              <Input
                id="picture"
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
              />
              {picturePreview && (
                <img
                  src={picturePreview}
                  alt="Profile preview"
                  className="h-20 w-20 rounded-full object-cover border border-border"
                />
              )}
            </div>
            {user.googleLinked && !user.hasPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Password (optional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Set a password to allow email/password sign-in.
                </p>
              </div>
            )}
            {errorMessage && <p className="text-sm text-red-500">{errorMessage}</p>}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save & Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
