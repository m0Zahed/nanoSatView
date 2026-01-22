import { useState } from 'react';
import { X, Link2, Unlink, Settings } from 'lucide-react';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';

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
  const [services, setServices] = useState<Service[]>([
    {
      id: 'capella',
      name: 'Capella',
      description: 'Satellite imagery and analytics',
      connected: true,
      logo: 'figma:asset/4cd63406e6ab2d332d6361418a9c6bf4fb53dca0.png',
    },
    {
      id: 'msl',
      name: 'MSL v2',
      description: 'Mission Systems Library',
      connected: false,
      logo: 'figma:asset/4e00837761b0379aa948797089aeee4e36f60ac7.png',
    },
    {
      id: 'google-sheets',
      name: 'Google Sheets',
      description: 'Spreadsheet integration',
      connected: true,
      logo: 'figma:asset/79f9540991611acc8ef9e2c4cdd2e207c586005a.png',
    },
    {
      id: 'diagramgpt',
      name: 'DiagramGPT',
      description: 'AI diagram generation',
      connected: true,
      logo: 'figma:asset/5234ef8dd429a3869ddae4436a895d1252b4570a.png',
    },
    {
      id: 'github',
      name: 'GitHub',
      description: 'Version control and collaboration',
      connected: false,
      logo: 'figma:asset/d7c9b449ae05744848c56899970eefd75390854e.png',
    },
    {
      id: 'google-docs',
      name: 'Google Docs',
      description: 'Document collaboration',
      connected: false,
      logo: 'figma:asset/79f9540991611acc8ef9e2c4cdd2e207c586005a.png',
    },
    {
      id: 'google-chat',
      name: 'Google Chat',
      description: 'Team messaging',
      connected: false,
      logo: 'figma:asset/79f9540991611acc8ef9e2c4cdd2e207c586005a.png',
    },
  ]);

  const handleToggleService = (serviceId: string) => {
    setServices(services.map(service => 
      service.id === serviceId 
        ? { ...service, connected: !service.connected }
        : service
    ));
  };

  const connectedCount = services.filter(s => s.connected).length;

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
            Manage connected services • {connectedCount} connected
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto pr-4 relative z-20" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {/* Connected Services Section */}
          <div className="space-y-4">
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
                  <Card className={`bg-[#222222] border-white/10 rounded-none overflow-hidden transition-all ${
                    service.connected ? 'border-white/20' : ''
                  }`}>
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
                          <div className={`w-2 h-2 rounded-full ${
                            service.connected ? 'bg-green-500' : 'bg-gray-600'
                          }`} />
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

          {/* Account Info Section */}
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-gray-500 font-mono text-xs uppercase tracking-widest">Account</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <Card className="bg-[#222222] border-white/10 rounded-none">
              <CardHeader>
                <CardTitle className="text-white text-lg font-bold font-mono">Profile</CardTitle>
                <CardDescription className="text-gray-500 text-xs font-mono">
                  Account information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 font-mono text-sm">Email</span>
                  <span className="text-white font-mono text-sm">user@example.com</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 font-mono text-sm">Account Type</span>
                  <span className="text-white font-mono text-sm">Professional</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-500 font-mono text-sm">Member Since</span>
                  <span className="text-white font-mono text-sm">Jan 2025</span>
                </div>
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
