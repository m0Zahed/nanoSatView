import { Hash, Plus, Settings, MoreVertical, Trash2, ClipboardList, Calendar, GitBranch, Package } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';

interface Member {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member';
  initials: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  members?: Member[];
  requirements?: string[];
  timeline?: string;
  components?: any[];
}

interface ProjectSidebarProps {
  organizationName: string;
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: () => void;
  onDeleteProject: (id: string) => void;
  onOpenSettings: () => void;
  onAddMember: (projectId: string) => void;
  onOpenOperationalFlow: (projectId: string) => void;
  onAddRequirements: (projectId: string) => void;
  onAddTimeline: (projectId: string) => void;
  onAddComponents: (projectId: string) => void;
}

export function ProjectSidebar({
  organizationName,
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  onDeleteProject,
  onOpenSettings,
  onAddMember,
  onOpenOperationalFlow,
  onAddRequirements,
  onAddTimeline,
  onAddComponents,
}: ProjectSidebarProps) {
  return (
    <div className="w-60 bg-[#1a1a1a] flex flex-col border-r border-white/10 relative overflow-hidden">
      {/* Film Grain Texture */}
      <div 
        className="absolute inset-0 opacity-[0.08] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Organization Header */}
      <div className="p-3 border-b border-white/10 relative z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-none hover:bg-white/5 transition-colors group border border-transparent hover:border-white/10">
              <span className="font-mono font-semibold text-white truncate tracking-wide">{organizationName}</span>
              <MoreVertical className="h-4 w-4 text-gray-400 group-hover:text-white" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 bg-[#1a1a1a] border-white/10">
            <DropdownMenuItem onClick={onOpenSettings} className="text-gray-300 hover:text-white hover:bg-white/5 font-mono">
              <Settings className="h-4 w-4 mr-2" />
              Organization Settings
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Projects Header */}
      <div className="px-3 py-2 flex items-center justify-between relative z-10">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-widest">
          Projects
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-gray-400 hover:text-white"
          onClick={onCreateProject}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Projects List */}
      <ScrollArea className="flex-1 relative z-10">
        <div className="px-2 pb-2 space-y-0.5">
          {projects.length === 0 ? (
            <div className="px-2 py-4 text-center">
              <p className="text-sm text-gray-500 font-mono">No projects yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={onCreateProject}
                className="text-xs text-gray-400 hover:text-white font-mono"
              >
                Create your first project
              </Button>
            </div>
          ) : (
            projects.map((project) => (
              <div key={project.id} className="mb-2">
                <div
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-none cursor-pointer transition-colors border ${
                    selectedProjectId === project.id
                      ? 'bg-white/10 text-white border-white/20'
                      : 'text-gray-400 hover:bg-white/5 hover:text-gray-200 border-transparent'
                  }`}
                  onClick={() => onSelectProject(project.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Hash className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate font-mono">{project.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10">
                      <DropdownMenuItem
                        className="text-red-400 focus:text-red-300 hover:bg-red-950/20 font-mono"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(project.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Member icons */}
                {project.members && project.members.length > 0 && (
                  <div className="flex items-center gap-0.5 px-2 mt-1 ml-6">
                    {project.members.slice(0, 4).map((member, index) => (
                      <Avatar
                        key={member.id}
                        className="h-5 w-5 border border-white/10"
                        style={{ marginLeft: index > 0 ? '-6px' : '0' }}
                      >
                        <AvatarFallback className="text-[9px] bg-[#222222] text-gray-300 font-mono">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                    {project.members.length > 4 && (
                      <div className="h-5 w-5 rounded-full bg-[#222222] border border-white/10 flex items-center justify-center text-[8px] text-gray-400 font-mono" style={{ marginLeft: '-6px' }}>
                        +{project.members.length - 4}
                      </div>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddMember(project.id);
                            }}
                            className="h-5 w-5 rounded-full bg-[#222222] hover:bg-white hover:text-black border border-white/10 flex items-center justify-center transition-colors ml-1"
                          >
                            <Plus className="h-3 w-3 text-gray-300" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1a1a1a] border-white/10 text-white font-mono">
                          <p>Add Member</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                {/* Show plus icon even if no members */}
                {(!project.members || project.members.length === 0) && (
                  <div className="flex items-center gap-0.5 px-2 mt-1 ml-6">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddMember(project.id);
                            }}
                            className="h-5 w-5 rounded-full bg-[#222222] hover:bg-white hover:text-black border border-white/10 flex items-center justify-center transition-colors"
                          >
                            <Plus className="h-3 w-3 text-gray-300" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent className="bg-[#1a1a1a] border-white/10 text-white font-mono">
                          <p>Add Member</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                
                {/* Operational Flow Section */}
                <div className="px-2 mt-2 ml-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenOperationalFlow(project.id);
                    }}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors w-full font-mono"
                  >
                    <GitBranch className="h-3 w-3" />
                    <span>Operational Flow</span>
                  </button>
                </div>
                
                {/* Requirements Section */}
                <div className="px-2 mt-1 ml-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddRequirements(project.id);
                    }}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors w-full font-mono"
                  >
                    <ClipboardList className="h-3 w-3" />
                    <span>
                      {project.requirements && project.requirements.length > 0
                        ? `Requirements (${project.requirements.length})`
                        : 'Add requirements'}
                    </span>
                  </button>
                </div>
                
                {/* Timeline Section */}
                <div className="px-2 mt-1 ml-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTimeline(project.id);
                    }}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors w-full font-mono"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>
                      {project.timeline ? 'Timeline' : 'Add timeline'}
                    </span>
                  </button>
                </div>
                
                {/* Components Section */}
                <div className="px-2 mt-1 ml-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddComponents(project.id);
                    }}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors w-full font-mono"
                  >
                    <Package className="h-3 w-3" />
                    <span>
                      {project.components && project.components.length > 0
                        ? `Components (${project.components.length})`
                        : 'Add components'}
                    </span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}