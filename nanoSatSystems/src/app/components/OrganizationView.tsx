import { FileText, Calendar, LayoutDashboard, GitBranch, FolderOpen } from 'lucide-react';
import { StlViewer } from '@/app/components/StlViewer';
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
          <TabsTrigger value="overview" className="gap-2 font-mono data-[state=inactive]:text-gray-400">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="flow" className="gap-2 font-mono data-[state=inactive]:text-gray-400">
            <GitBranch className="h-4 w-4" />
            Operational Flow
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2 font-mono data-[state=inactive]:text-gray-400">
            <FolderOpen className="h-4 w-4" />
            Documents
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="flex-1 overflow-auto m-0">
          {/* 3D STL Viewer - Full Width at Top */}
          <div className="h-[500px] border-b border-white/10">
            <StlViewer className="h-full" />
          </div>

          {/* Project Info Card - Extends to Bottom */}
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Project Information */}
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

              {/* Latest Information Section */}
              <div className="bg-[#222222] rounded-none border border-white/10 p-6">
                <h2 className="text-lg font-bold text-white mb-4 font-mono">Latest Information</h2>
                <div className="space-y-4">
                  {/* Recent Activity */}
                  <div className="border-l-2 border-white/20 pl-4 space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>2 hours ago</span>
                      </div>
                      <p className="text-sm text-white font-mono">Operational Flow diagram updated</p>
                      <p className="text-xs text-gray-400 font-mono">Added 3 new components and 5 connections</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>5 hours ago</span>
                      </div>
                      <p className="text-sm text-white font-mono">New document uploaded</p>
                      <p className="text-xs text-gray-400 font-mono">Technical_Specifications_v2.pdf</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>1 day ago</span>
                      </div>
                      <p className="text-sm text-white font-mono">Project milestone reached</p>
                      <p className="text-xs text-gray-400 font-mono">Design phase completed</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>2 days ago</span>
                      </div>
                      <p className="text-sm text-white font-mono">Team member added</p>
                      <p className="text-xs text-gray-400 font-mono">Sarah Chen joined as Systems Engineer</p>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span>3 days ago</span>
                      </div>
                      <p className="text-sm text-white font-mono">3D model uploaded</p>
                      <p className="text-xs text-gray-400 font-mono">satellite_chassis.stl</p>
                    </div>
                  </div>

                  {/* Stats Summary */}
                  <div className="pt-4 border-t border-white/10 grid grid-cols-3 gap-4">
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-none p-3 text-center">
                      <div className="text-2xl font-bold text-white font-mono">24</div>
                      <div className="text-xs text-gray-400 font-mono">Total Documents</div>
                    </div>
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-none p-3 text-center">
                      <div className="text-2xl font-bold text-white font-mono">8</div>
                      <div className="text-xs text-gray-400 font-mono">Team Members</div>
                    </div>
                    <div className="bg-[#1a1a1a] border border-white/10 rounded-none p-3 text-center">
                      <div className="text-2xl font-bold text-white font-mono">92%</div>
                      <div className="text-xs text-gray-400 font-mono">Progress</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

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