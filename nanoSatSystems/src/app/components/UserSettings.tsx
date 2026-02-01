import { useEffect, useMemo, useState } from 'react';
import { Link2, Unlink } from 'lucide-react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { postJson } from '@/app/auth/api';
import { useAuth } from '@/app/auth/AuthContext';

// Import images
import capellaLogo from '@/assets/4cd63406e6ab2d332d6361418a9c6bf4fb53dca0.png';
import mslLogo from '@/assets/4e00837761b0379aa948797089aeee4e36f60ac7.png';
import diagramGPTLogo from '@/assets/5234ef8dd429a3869ddae4436a895d1252b4570a.png';

interface Service {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  logo: string;
}

interface UserSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettings({ open, onOpenChange }: UserSettingsProps) {
  const { user, refreshUser } = useAuth();
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureDataUrl, setPictureDataUrl] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([
    {
      id: 'capella',
      name: 'Capella',
      description: 'Satellite imagery and analytics',
      connected: true,
      logo: capellaLogo,
    },
    {
      id: 'msl',
      name: 'MSL v2',
      description: 'Mission Systems Library',
      connected: false,
      logo: mslLogo,
    },
    {
      id: 'diagramgpt',
      name: 'DiagramGPT',
      description: 'AI diagram generation',
      connected: true,
      logo: diagramGPTLogo,
    },
  ]);

  const handleToggleService = (serviceId: string) => {
    setServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, connected: !service.connected }
          : service
      )
    );
  };

  const connectedCount = services.filter((service) => service.connected).length;
  const removedIntegrations = useMemo(
    () => ['Excel', 'Google Sheets', 'Google Docs', 'Google Chat', 'GitHub'],
    []
  );

  useEffect(() => {
    setPicturePreview(user?.pictureUrl ?? null);
    setPictureDataUrl(null);
    setPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [user, open]);

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

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSaving(true);
    try {
      const payload: Record<string, unknown> = {
        pictureUrl: pictureDataUrl ?? picturePreview ?? null,
      };
      if (password) {
        payload.password = password;
      }
      const { status, data } = await postJson('/auth/profile', payload);
      if (status === 200) {
        await refreshUser();
        setPassword('');
        setPictureDataUrl(null);
        setSuccessMessage('Profile updated.');
        return;
      }
      const message =
        data && typeof data === 'object' && 'error' in data
          ? ((data as { error: { message?: string } }).error?.message ?? 'Profile update failed.')
          : 'Profile update failed.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-[#1a1a1a] border-white/10 rounded-none">
        {/* Film Grain Texture */}
        <div
          className="absolute inset-0 opacity-[0.15] pointer-events-none z-10 mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <DialogHeader className="relative z-20">
          <DialogTitle className="text-3xl font-bold text-white" style={{ fontFamily: 'serif' }}>
            User Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400 font-mono">
            Manage your profile and connected services - {connectedCount} connected
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-4 relative z-20" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {/* Registration Info Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Registration Info</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Card className="bg-[#222222] border-white/10 rounded-none">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold font-mono">Profile</CardTitle>
                <CardDescription className="text-gray-500 text-xs font-mono">
                  Registration details and security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-picture" className="text-gray-500 font-mono text-xs uppercase">
                      Profile Picture
                    </Label>
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      className="rounded-none"
                    />
                    {picturePreview && (
                      <img
                        src={picturePreview}
                        alt="Profile preview"
                        className="h-16 w-16 object-cover border border-white/10"
                      />
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-gray-500 font-mono text-xs uppercase">
                      {user?.hasPassword ? 'Change Password' : 'Add Password'}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={user?.hasPassword ? 'New password' : 'Set a password'}
                      minLength={8}
                      className="rounded-none"
                    />
                    <p className="text-xs text-gray-500 font-mono">
                      {user?.hasPassword
                        ? 'Update your password to keep your account secure.'
                        : 'Add a password to allow email/password sign-in.'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-500 font-mono text-sm">Full Name</span>
                    <span className="text-white font-mono text-sm">{user?.fullName ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-500 font-mono text-sm">Username</span>
                    <span className="text-white font-mono text-sm">{user?.username ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-500 font-mono text-sm">Email</span>
                    <span className="text-white font-mono text-sm">{user?.email ?? '-'}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-500 font-mono text-sm">Date of Birth</span>
                    <span className="text-white font-mono text-sm">{user?.dateOfBirth ?? '-'}</span>
                  </div>
                </div>

                {(errorMessage || successMessage) && (
                  <p className={`text-sm font-mono ${errorMessage ? 'text-red-500' : 'text-green-500'}`}>
                    {errorMessage ?? successMessage}
                  </p>
                )}

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSaveProfile}
                    className="rounded-none font-mono text-xs bg-white text-black hover:bg-gray-200"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Profile'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connected Services Section */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Integrations</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service, index) => (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`bg-[#222222] border-white/10 rounded-none overflow-hidden transition-all ${
                      service.connected ? 'border-white/20' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {/* Service Logo */}
                          <div className="w-12 h-12 bg-white rounded-none p-2 flex items-center justify-center">
                            <img
                              src={service.logo}
                              alt={service.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg font-bold font-mono">
                              {service.name}
                            </CardTitle>
                            <CardDescription className="text-gray-500 text-xs font-mono mt-1">
                              {service.description}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        {/* Status Indicator */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              service.connected ? 'bg-green-500' : 'bg-gray-600'
                            }`}
                          />
                          <span className="text-xs font-mono text-gray-500">
                            {service.connected ? 'CONNECTED' : 'DISCONNECTED'}
                          </span>
                        </div>

                        {/* Toggle Button */}
                        <Button
                          size="sm"
                          variant={service.connected ? 'outline' : 'default'}
                          onClick={() => handleToggleService(service.id)}
                          className={`rounded-none font-mono text-xs ${
                            service.connected
                              ? 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                              : 'bg-white text-black hover:bg-gray-200'
                          }`}
                        >
                          {service.connected ? (
                            <>
                              <Unlink className="h-3 w-3 mr-1" />
                              Disconnect
                            </>
                          ) : (
                            <>
                              <Link2 className="h-3 w-3 mr-1" />
                              Connect
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Removed Integrations</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>
            <Card className="bg-[#222222] border-white/10 rounded-none">
              <CardContent className="pt-6 space-y-3">
                {removedIntegrations.map((integration) => (
                  <div
                    key={integration}
                    className="flex items-center justify-between border-b border-white/5 pb-3 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center gap-2 text-sm font-mono text-gray-400">
                      <span className="h-1.5 w-1.5 bg-gray-500 inline-block" />
                      {integration}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {}}
                      className="rounded-none font-mono text-xs border-white/10 text-gray-400 hover:text-white hover:bg-white/5"
                    >
                      <Link2 className="h-3 w-3 mr-1" />
                      Connect
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4 relative z-20">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-none border-white/10 text-gray-400 hover:text-white hover:bg-white/5 font-mono"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
