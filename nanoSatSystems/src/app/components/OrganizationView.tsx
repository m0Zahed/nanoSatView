import { FileText, GitBranch, FolderOpen } from 'lucide-react';
import { OperationalFlow } from '@/app/components/OperationalFlow';
import { DocumentManager } from '@/app/components/DocumentManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { useState } from 'react';

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

export function OrganizationView({ project, activeTab = 'flow', onTabChange }: OrganizationViewProps) {
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
    <div className="flex-1 bg-[#1a1a1a] flex flex-col relative overflow-hidden">
      {/* Project Header */}
      <div className="bg-[#222222] border-b border-white/10 px-6 py-4 relative z-20 flex-shrink-0 overflow-hidden group">
        {/* Checkered Background */}
        <div className="absolute inset-0 grid grid-cols-20 grid-rows-5 pointer-events-none">
          {Array.from({ length: 100 }).map((_, i) => {
            const isEven = Math.floor(i / 20) % 2 === 0;
            const isEvenCol = i % 2 === 0;
            const shouldFill = isEven ? isEvenCol : !isEvenCol;
            
            return (
              <div
                key={i}
                className={`border border-white/5 transition-all duration-300 group-hover:bg-white/5 ${
                  shouldFill ? 'bg-white/[0.02]' : 'bg-transparent'
                }`}
                style={{
                  transitionDelay: `${Math.random() * 200}ms`,
                }}
              />
            );
          })}
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'serif' }}>{project.name}</h1>
          </div>
          {project.description && (
            <p className="text-sm text-gray-400 font-mono">{project.description}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="flex-1 flex flex-col relative overflow-hidden">
        <TabsList className="w-full justify-start border-b border-white/10 rounded-none bg-[#222222] h-12 px-6 flex-shrink-0">
          <TabsTrigger value="flow" className="gap-2 font-mono data-[state=inactive]:text-gray-400">
            <GitBranch className="h-4 w-4" />
            Operational Flow
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 font-mono data-[state=inactive]:text-gray-400">
            <FolderOpen className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Operational Flow Tab */}
        <TabsContent value="flow" className="flex-1 overflow-hidden m-0">
          <OperationalFlow />
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="flex-1 overflow-hidden m-0">
          <DocumentManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
