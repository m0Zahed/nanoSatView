import { FileText, Calendar, LayoutDashboard, GitBranch, FolderOpen } from 'lucide-react';
import { StlViewer } from '@/app/components/StlViewer';
import { OperationalFlow } from '@/app/components/OperationalFlow';
import { DocumentManager } from '@/app/components/DocumentManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
}

interface OrganizationViewProps {
  project: Project | null;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function OrganizationView({ project, activeTab = 'overview', onTabChange }: OrganizationViewProps) {
  if (!project) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#1a1a1a] relative">
        <div className="text-center relative z-20">
          <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-400 mb-2 font-mono">
            No project selected
          </h3>
          <p className="text-gray-500 max-w-sm font-mono text-sm">
            Select a project from the sidebar or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#1a1a1a] flex flex-col relative">
      {/* Project Header */}
      <div className="bg-[#222222] border-b border-white/10 px-6 py-4 relative z-20">
        <div className="flex items-center gap-2 text-gray-400 mb-2">
          <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'serif' }}>{project.name}</h1>
        </div>
        {project.description && (
          <p className="text-sm text-gray-400 font-mono">{project.description}</p>
        )}
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col relative z-20">{/* Added onValueChange */}
        <TabsList className="w-full justify-start border-b border-white/10 rounded-none bg-[#222222] h-12 px-6">
          <TabsTrigger value="overview" className="gap-2 font-mono">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="flow" className="gap-2 font-mono">
            <GitBranch className="h-4 w-4" />
            Operational Flow
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 font-mono">
            <FolderOpen className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-auto m-0">
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* 3D STL Viewer - Top Half */}
              <div className="h-[500px]">
                <StlViewer className="h-full" />
              </div>

              {/* Project Info Card - Moved to bottom */}
              <div className="bg-[#222222] rounded-none border border-white/10 p-6">
                <h2 className="text-lg font-bold text-white mb-4 font-mono">Project Information</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400 font-mono">Created:</span>
                    <span className="text-white font-mono">{project.createdAt.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-400 font-mono">Description:</span>
                    <span className="text-white font-mono">{project.description || 'No description'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Operational Flow Tab */}
        <TabsContent value="flow" className="flex-1 m-0">
          <OperationalFlow />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="flex-1 m-0">
          <DocumentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}