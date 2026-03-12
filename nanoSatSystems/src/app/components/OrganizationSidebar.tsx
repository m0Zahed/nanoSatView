import { Plus, Building2, Home } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';

interface Organization {
  id: string;
  name: string;
  initials: string;
  color: string;
}

interface OrganizationSidebarProps {
  organizations: Organization[];
  selectedOrgId: string | null;
  onSelectOrg: (id: string) => void;
  onCreateOrg: () => void;
  onSelectHome: () => void;
}

export function OrganizationSidebar({
  organizations,
  selectedOrgId,
  onSelectOrg,
  onCreateOrg,
  onSelectHome,
}: OrganizationSidebarProps) {
  return (
    <div className="w-20 bg-[#1a1a1a] flex flex-col items-center py-3 gap-2 border-r border-white/10 relative overflow-hidden">
      {/* Film Grain Texture */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      <TooltipProvider>
        {/* Home Button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={onSelectHome}
              className={`w-12 h-12 rounded-none flex items-center justify-center font-mono text-sm transition-all border relative z-10 ${ 
                selectedOrgId === null
                  ? 'bg-white text-black border-white/20'
                  : 'bg-[#222222] text-gray-400 border-white/10 hover:bg-white hover:text-black'
              }`}
            >
              <Home className="h-5 w-5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-[#1a1a1a] border-white/10 text-white font-mono">
            <p>Home</p>
          </TooltipContent>
        </Tooltip>

        {/* Separator */}
        <div className="w-8 h-px bg-white/10 mb-1" />

        <ScrollArea className="flex-1 w-full">
          <div className="flex flex-col items-center gap-2 px-3">
            {organizations.map((org) => (
              <Tooltip key={org.id}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onSelectOrg(org.id)}
                    className={`w-12 h-12 rounded-none flex items-center justify-center font-mono text-sm transition-all border relative z-10 ${
                      selectedOrgId === org.id
                        ? 'bg-white text-black border-white/20'
                        : 'bg-[#222222] text-gray-400 border-white/10 hover:bg-white hover:text-black'
                    }`}
                  >
                    {org.initials}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-[#1a1a1a] border-white/10 text-white font-mono">
                  <p>{org.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </ScrollArea>

        <div className="px-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onCreateOrg}
                variant="ghost"
                size="icon"
                className="w-12 h-12 rounded-none bg-[#222222] hover:bg-white border border-white/10 transition-all text-gray-400 hover:text-black relative z-10"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-[#1a1a1a] border-white/10 text-white font-mono">
              <p>Create Organization</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  );
}